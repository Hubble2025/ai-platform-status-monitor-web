import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import type { Provider, Incident } from '../lib/database.types';

interface ReliabilityDashboardProps {
  onBack: () => void;
  providers: Provider[];
}

interface ProviderReliability {
  provider: Provider;
  uptime30d: number;
  uptime90d: number;
  incidents30d: number;
  incidents90d: number;
  mttr: number;
  trend: 'up' | 'down' | 'stable';
  lastIncident: string | null;
}

export function ReliabilityDashboard({ onBack, providers }: ReliabilityDashboardProps) {
  const { t } = useTheme();
  const [reliability, setReliability] = useState<ProviderReliability[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30' | '90'>('30');

  useEffect(() => {
    loadReliabilityData();
  }, [providers]);

  async function loadReliabilityData() {
    setLoading(true);
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const reliabilityData = await Promise.all(
        providers.map(async (provider) => {
          const { data: incidents30d } = await supabase
            .from('incidents')
            .select('*')
            .eq('provider_id', provider.id)
            .gte('created_at', thirtyDaysAgo.toISOString());

          const { data: incidents90d } = await supabase
            .from('incidents')
            .select('*')
            .eq('provider_id', provider.id)
            .gte('created_at', ninetyDaysAgo.toISOString());

          const { data: checks30d } = await supabase
            .from('status_checks')
            .select('*')
            .eq('provider_id', provider.id)
            .gte('checked_at', thirtyDaysAgo.toISOString());

          const { data: checks90d } = await supabase
            .from('status_checks')
            .select('*')
            .eq('provider_id', provider.id)
            .gte('checked_at', ninetyDaysAgo.toISOString());

          const uptime30d = calculateUptime(checks30d || []);
          const uptime90d = calculateUptime(checks90d || []);

          const resolvedIncidents = (incidents30d || []).filter(
            i => i.resolved_at && i.started_at
          );

          const mttr = resolvedIncidents.length > 0
            ? resolvedIncidents.reduce((sum, inc) => {
                const start = new Date(inc.started_at!).getTime();
                const end = new Date(inc.resolved_at!).getTime();
                return sum + (end - start);
              }, 0) / resolvedIncidents.length / (1000 * 60)
            : 0;

          const trend = uptime30d > uptime90d ? 'up' : uptime30d < uptime90d ? 'down' : 'stable';

          const lastIncident = (incidents30d || [])
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          return {
            provider,
            uptime30d,
            uptime90d,
            incidents30d: (incidents30d || []).length,
            incidents90d: (incidents90d || []).length,
            mttr,
            trend,
            lastIncident: lastIncident?.created_at || null,
          };
        })
      );

      setReliability(reliabilityData.sort((a, b) => {
        const uptimeA = timeRange === '30' ? a.uptime30d : a.uptime90d;
        const uptimeB = timeRange === '30' ? b.uptime30d : b.uptime90d;
        return uptimeB - uptimeA;
      }));
    } catch (error) {
      console.error('Failed to load reliability data:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateUptime(checks: any[]): number {
    if (checks.length === 0) return 100;
    const operational = checks.filter(c => c.status === 'operational').length;
    return (operational / checks.length) * 100;
  }

  function getUptimeColor(uptime: number): string {
    if (uptime >= 99.9) return 'text-green-400';
    if (uptime >= 99.5) return 'text-yellow-400';
    if (uptime >= 99) return 'text-orange-400';
    return 'text-red-400';
  }

  function getUptimeBgColor(uptime: number): string {
    if (uptime >= 99.9) return 'bg-green-900/20 border-green-800';
    if (uptime >= 99.5) return 'bg-yellow-900/20 border-yellow-800';
    if (uptime >= 99) return 'bg-orange-900/20 border-orange-800';
    return 'bg-red-900/20 border-red-800';
  }

  function formatMTTR(minutes: number): string {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
    return `${(minutes / 1440).toFixed(1)}d`;
  }

  const avgUptime = reliability.length > 0
    ? reliability.reduce((sum, r) => sum + (timeRange === '30' ? r.uptime30d : r.uptime90d), 0) / reliability.length
    : 0;

  const totalIncidents = reliability.reduce((sum, r) => sum + (timeRange === '30' ? r.incidents30d : r.incidents90d), 0);

  const mostReliable = reliability[0];
  const leastReliable = reliability[reliability.length - 1];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reliability Dashboard</h1>
          <p className="text-gray-400">Track uptime and reliability metrics across all providers</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('30')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === '30'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('90')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === '90'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Activity className="w-4 h-4" />
            Average Uptime
          </div>
          <div className={`text-3xl font-bold ${getUptimeColor(avgUptime)}`}>
            {avgUptime.toFixed(2)}%
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Total Incidents
          </div>
          <div className="text-3xl font-bold text-white">{totalIncidents}</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            Most Reliable
          </div>
          <div className="text-lg font-bold text-green-400">
            {mostReliable?.provider.name || 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {mostReliable ? `${(timeRange === '30' ? mostReliable.uptime30d : mostReliable.uptime90d).toFixed(2)}% uptime` : ''}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <TrendingDown className="w-4 h-4" />
            Needs Attention
          </div>
          <div className="text-lg font-bold text-red-400">
            {leastReliable?.provider.name || 'N/A'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {leastReliable ? `${(timeRange === '30' ? leastReliable.uptime30d : leastReliable.uptime90d).toFixed(2)}% uptime` : ''}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">Provider Rankings</h2>
        <div className="space-y-3">
          {reliability.map((item, index) => {
            const uptime = timeRange === '30' ? item.uptime30d : item.uptime90d;
            const incidents = timeRange === '30' ? item.incidents30d : item.incidents90d;

            return (
              <div
                key={item.provider.id}
                className={`border rounded-lg p-4 ${getUptimeBgColor(uptime)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-600">#{index + 1}</div>
                    <div>
                      <div className="font-semibold text-white">{item.provider.name}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span>{incidents} incidents</span>
                        {item.mttr > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              MTTR: {formatMTTR(item.mttr)}
                            </span>
                          </>
                        )}
                        {item.lastIncident && (
                          <>
                            <span>•</span>
                            <span>Last: {new Date(item.lastIncident).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {item.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-400" />}
                    {item.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-400" />}
                    <div className={`text-2xl font-bold ${getUptimeColor(uptime)}`}>
                      {uptime.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      uptime >= 99.9 ? 'bg-green-500' :
                      uptime >= 99.5 ? 'bg-yellow-500' :
                      uptime >= 99 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${uptime}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">SLA Compliance</h2>
        <div className="space-y-4">
          {[
            { threshold: 99.99, label: 'Four Nines (99.99%)', color: 'text-green-400' },
            { threshold: 99.9, label: 'Three Nines (99.9%)', color: 'text-blue-400' },
            { threshold: 99.5, label: 'Two Nines+ (99.5%)', color: 'text-yellow-400' },
            { threshold: 99, label: 'Two Nines (99%)', color: 'text-orange-400' },
          ].map(({ threshold, label, color }) => {
            const count = reliability.filter(r => {
              const uptime = timeRange === '30' ? r.uptime30d : r.uptime90d;
              return uptime >= threshold;
            }).length;

            const percentage = (count / reliability.length) * 100;

            return (
              <div key={threshold}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">{label}</span>
                  <span className={`text-sm font-semibold ${color}`}>
                    {count}/{reliability.length} providers ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${color.replace('text-', 'bg-')}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
