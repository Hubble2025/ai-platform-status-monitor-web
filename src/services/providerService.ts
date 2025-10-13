import { supabase } from '../lib/supabase';
import type { Provider, Incident, ProviderWithIncidents } from '../lib/database.types';

export async function fetchProviders(): Promise<Provider[]> {
  const [providersData, registryData] = await Promise.all([
    supabase
      .from('providers')
      .select('*')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('platform_registry')
      .select('*')
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .order('name')
  ]);

  if (providersData.error) throw providersData.error;
  if (registryData.error) throw registryData.error;

  const providers = providersData.data || [];
  const registryPlatforms = registryData.data || [];

  const combinedProviders = [
    ...providers,
    ...registryPlatforms.map((platform: any) => ({
      id: platform.id,
      name: platform.name,
      slug: platform.name.toLowerCase().replace(/\s+/g, '-'),
      status_url: platform.status_page_url || platform.status_api_url,
      api_endpoint: platform.status_api_url,
      logo_url: platform.metadata?.logo_url || null,
      is_active: true,
      last_checked: platform.last_check_at,
      auto_discovered: platform.auto_discovered,
      reliability_score: platform.reliability_score,
      category: platform.category,
    }))
  ];

  return combinedProviders;
}

export async function fetchProviderWithIncidents(slug: string): Promise<ProviderWithIncidents | null> {
  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (providerError) throw providerError;
  if (!provider) return null;

  const { data: incidents, error: incidentsError } = await supabase
    .from('incidents')
    .select('*')
    .eq('provider_id', provider.id)
    .order('started_at', { ascending: false })
    .limit(20);

  if (incidentsError) throw incidentsError;

  const { data: latestCheck, error: checkError } = await supabase
    .from('status_checks')
    .select('*')
    .eq('provider_id', provider.id)
    .order('checked_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (checkError) throw checkError;

  return {
    ...provider,
    incidents: incidents || [],
    latest_check: latestCheck || undefined,
  };
}

export async function fetchActiveIncidents(): Promise<(Incident & { provider: Provider })[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select(`
      *,
      provider:providers(*)
    `)
    .is('resolved_at', null)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return (data || []) as (Incident & { provider: Provider })[];
}

export async function fetchRecentIncidents(limit = 50): Promise<(Incident & { provider: Provider })[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select(`
      *,
      provider:providers(*)
    `)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as (Incident & { provider: Provider })[];
}

export function getProviderStatus(provider: ProviderWithIncidents): {
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  activeIncidents: number;
  severity: 'none' | 'minor' | 'major' | 'critical';
} {
  const activeIncidents = provider.incidents?.filter(i => !i.resolved_at) || [];

  if (activeIncidents.length === 0) {
    return {
      status: 'operational',
      activeIncidents: 0,
      severity: 'none',
    };
  }

  const hasCritical = activeIncidents.some(i => i.severity === 'critical');
  const hasMajor = activeIncidents.some(i => i.severity === 'major');
  const hasOutage = activeIncidents.some(i => i.status === 'outage');

  if (hasOutage || hasCritical) {
    return {
      status: 'outage',
      activeIncidents: activeIncidents.length,
      severity: 'critical',
    };
  }

  if (hasMajor) {
    return {
      status: 'degraded',
      activeIncidents: activeIncidents.length,
      severity: 'major',
    };
  }

  return {
    status: 'degraded',
    activeIncidents: activeIncidents.length,
    severity: 'minor',
  };
}

export interface HistoryDataPoint {
  timestamp: string;
  hour: string;
  status: 'operational' | 'degraded' | 'outage';
  incidentCount: number;
  communityReports: number;
}

export async function fetch24HourProviderHistory(providerId: string): Promise<HistoryDataPoint[]> {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const [incidentsData, reportsData] = await Promise.all([
    supabase
      .from('incidents')
      .select('started_at, resolved_at, severity, status')
      .eq('provider_id', providerId)
      .gte('started_at', twentyFourHoursAgo.toISOString()),
    supabase
      .from('user_issue_reports')
      .select('created_at, issue_type, severity')
      .eq('provider_id', providerId)
      .gte('created_at', twentyFourHoursAgo.toISOString())
  ]);

  if (incidentsData.error) throw incidentsData.error;
  if (reportsData.error) throw reportsData.error;

  const incidents = incidentsData.data || [];
  const reports = reportsData.data || [];

  const hourlyData: Map<string, { incidents: number; reports: number; worstStatus: string }> = new Map();

  for (let i = 23; i >= 0; i--) {
    const hourTime = new Date();
    hourTime.setHours(hourTime.getHours() - i, 0, 0, 0);
    const hourKey = hourTime.toISOString().slice(0, 13);
    hourlyData.set(hourKey, { incidents: 0, reports: 0, worstStatus: 'operational' });
  }

  incidents.forEach((incident: any) => {
    const startHour = new Date(incident.started_at).toISOString().slice(0, 13);
    const endHour = incident.resolved_at
      ? new Date(incident.resolved_at).toISOString().slice(0, 13)
      : new Date().toISOString().slice(0, 13);

    let currentHour = new Date(startHour + ':00:00');
    const endTime = new Date(endHour + ':00:00');

    while (currentHour <= endTime) {
      const hourKey = currentHour.toISOString().slice(0, 13);
      const data = hourlyData.get(hourKey);
      if (data) {
        data.incidents++;
        if (incident.severity === 'critical' || incident.status === 'outage') {
          data.worstStatus = 'outage';
        } else if (data.worstStatus !== 'outage' && (incident.severity === 'major' || incident.status === 'degraded')) {
          data.worstStatus = 'degraded';
        }
      }
      currentHour.setHours(currentHour.getHours() + 1);
    }
  });

  reports.forEach((report: any) => {
    const reportHour = new Date(report.created_at).toISOString().slice(0, 13);
    const data = hourlyData.get(reportHour);
    if (data) {
      data.reports++;
      if (data.worstStatus === 'operational' && data.reports >= 3) {
        data.worstStatus = 'degraded';
      }
    }
  });

  const result: HistoryDataPoint[] = [];
  hourlyData.forEach((value, key) => {
    const timestamp = new Date(key + ':00:00');
    result.push({
      timestamp: timestamp.toISOString(),
      hour: `${timestamp.getHours().toString().padStart(2, '0')}:00`,
      status: value.worstStatus as 'operational' | 'degraded' | 'outage',
      incidentCount: value.incidents,
      communityReports: value.reports,
    });
  });

  result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return result;
}
