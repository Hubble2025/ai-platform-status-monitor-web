import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface StatusResult {
  provider_id: string;
  status: string;
  response_time: number;
  incidents: any[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('*')
      .eq('is_active', true);

    if (providersError) throw providersError;

    const results: StatusResult[] = [];

    for (const provider of providers || []) {
      const startTime = Date.now();
      let status = 'operational';
      let incidents: any[] = [];

      try {
        if (provider.api_endpoint) {
          const response = await fetch(provider.api_endpoint, {
            signal: AbortSignal.timeout(10000),
          });
          
          if (!response.ok) {
            status = 'degraded';
          }

          const data = await response.json();
          incidents = parseStatusData(data, provider.slug);
        }
      } catch (error) {
        status = 'outage';
        console.error(`Failed to check ${provider.name}:`, error);
      }

      const responseTime = Date.now() - startTime;

      await supabase.from('status_checks').insert({
        provider_id: provider.id,
        status,
        response_time: responseTime,
        checked_at: new Date().toISOString(),
        raw_response: null,
      });

      await supabase
        .from('providers')
        .update({ last_checked: new Date().toISOString() })
        .eq('id', provider.id);

      for (const incident of incidents) {
        const fingerprint = `${provider.id}-${incident.title}-${incident.started_at}`;
        
        await supabase.from('incidents').upsert(
          {
            provider_id: provider.id,
            component: incident.component,
            status: incident.status,
            severity: incident.severity,
            title: incident.title,
            description: incident.description,
            regions: incident.regions || [],
            started_at: incident.started_at,
            updated_at: new Date().toISOString(),
            resolved_at: incident.resolved_at,
            fingerprint,
            raw_data: incident,
          },
          { onConflict: 'fingerprint' }
        );
      }

      results.push({
        provider_id: provider.id,
        status,
        response_time: responseTime,
        incidents,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked_at: new Date().toISOString(),
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Status check failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function parseStatusData(data: any, providerSlug: string): any[] {
  const incidents: any[] = [];

  try {
    if (data.incidents && Array.isArray(data.incidents)) {
      for (const incident of data.incidents) {
        incidents.push({
          component: incident.components?.[0]?.name || null,
          status: incident.status || 'investigating',
          severity: incident.impact || 'minor',
          title: incident.name || incident.title || 'Unknown incident',
          description: incident.body || incident.description || null,
          regions: incident.affected_components || [],
          started_at: incident.created_at || incident.started_at || new Date().toISOString(),
          resolved_at: incident.resolved_at || null,
        });
      }
    }

    if (data.components && Array.isArray(data.components)) {
      for (const component of data.components) {
        if (component.status && component.status !== 'operational') {
          incidents.push({
            component: component.name,
            status: component.status,
            severity: getSeverityFromStatus(component.status),
            title: `${component.name} - ${component.status}`,
            description: component.description || null,
            regions: [],
            started_at: component.updated_at || new Date().toISOString(),
            resolved_at: null,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Failed to parse status data for ${providerSlug}:`, error);
  }

  return incidents;
}

function getSeverityFromStatus(status: string): string {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes('major') || lowerStatus.includes('outage')) return 'major';
  if (lowerStatus.includes('critical')) return 'critical';
  return 'minor';
}
