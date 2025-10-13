import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import type { Provider, Incident, StatusCheck } from '../lib/database.types';

interface ProviderComparisonProps {
  onBack: () => void;
  providers: Provider[];
}

interface ProviderStats {
  provider: Provider;
  totalIncidents: number;
  criticalIncidents: number;
  activeIncidents: number;
  avgResolutionTime: number;
  uptimePercentage: number;
  lastIncidentDate: string | null;
  recentChecks: StatusCheck[];
}

export function ProviderComparison({ onBack, providers }: ProviderComparisonProps) {
  const { t } = useTheme();
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [stats, setStats] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProviders.length > 0) {
      loadStats();
    }
  }, [selectedProviders]);

  async function loadStats() {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const statsPromises = selectedProviders.map(async (providerId) => {
        const provider = providers.find(p => p.id === providerId)!;

        const { data: incidents } = await supabase
          .from('incidents')
          .select('*')
          .eq('provider_id', providerId)
          .gte('created_at', thirtyDaysAgo.toISOString());

        const { data: checks } = await supabase
          .from('status_checks')
          .select('*')
          .eq('provider_id', providerId)
          .gte('checked_at', thirtyDaysAgo.toISOString())
          .order('checked_at', { ascending: false })
          .limit(100);

        const totalIncidents = incidents?.length || 0;
        const criticalIncidents = incidents?.filter(i => i.severity === 'critical').length || 0;
        const activeIncidents = incidents?.filter(i => !i.resolved_at).length || 0;

        const resolvedIncidents = incidents?.filter(i => i.resolved_at && i.started_at) || [];
        const avgResolutionTime = resolvedIncidents.length > 0
          ? resolvedIncidents.reduce((sum, inc) => {
              const start = new Date(inc.started_at!).getTime();
              const end = new Date(inc.resolved_at!).getTime();
              return sum + (end - start);
            }, 0) / resolvedIncidents.length / (1000 * 60 * 60)
          : 0;

        const operationalChecks = checks?.filter(c => c.status === 'operational').length || 0;
        const totalChecks = checks?.length || 1;
        const uptimePercentage = (operationalChecks / totalChecks) * 100;

        const lastIncident = incidents?.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          provider,
          totalIncidents,
          criticalIncidents,
          activeIncidents,
          avgResolutionTime,
          uptimePercentage,
          lastIncidentDate: lastIncident?.created_at || null,
          recentChecks: checks || [],
        };
      });

      const results = await Promise.all(statsPromises);
      setStats(results);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleProvider(providerId: string) {
    setSelectedProviders(prev => {
      if (prev.includes(providerId)) {
        return prev.filter(id => id !== providerId);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, providerId];
    });
  }

  function getUptimeColor(percentage: number) {
    if (percentage >= 99.9) return 'text-green-400';
    if (percentage >= 99) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getComparisonIndicator(value: number, lower: number) {
    if (value < lower) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (value > lower) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return null;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </button>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('comparison.title')}</h1>
        <p className="text-gray-400">{t('comparison.subtitle')} (last 30 days)</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          {t('comparison.selectProviders')} ({t('comparison.maxProviders')})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {providers.map(provider => (
            <button
              key={provider.id}
              onClick={() => toggleProvider(provider.id)}
              disabled={!selectedProviders.includes(provider.id) && selectedProviders.length >= 4}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedProviders.includes(provider.id)
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <div className="text-sm font-medium text-white truncate">{provider.name}</div>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400">
          {t('common.loading')}
        </div>
      )}

      {!loading && stats.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {t('comparison.uptime')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {t('comparison.totalIncidents')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {t('comparison.critical')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {t('comparison.activeNow')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {t('comparison.avgResolution')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {t('comparison.lastIncident')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {stats.map((stat, index) => {
                      const avgIncidents = stats.reduce((sum, s) => sum + s.totalIncidents, 0) / stats.length;
                      const avgResolution = stats.reduce((sum, s) => sum + s.avgResolutionTime, 0) / stats.length;

                      return (
                        <tr key={stat.provider.id} className="hover:bg-gray-800/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">{stat.provider.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-lg font-bold ${getUptimeColor(stat.uptimePercentage)}`}>
                              {stat.uptimePercentage.toFixed(2)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white">{stat.totalIncidents}</span>
                              {getComparisonIndicator(stat.totalIncidents, avgIncidents)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="text-sm text-white">{stat.criticalIncidents}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {stat.activeIncidents > 0 ? (
                              <span className="px-2 py-1 text-xs font-medium bg-red-900/50 text-red-400 rounded">
                                {stat.activeIncidents} active
                              </span>
                            ) : (
                              <span className="text-sm text-green-400">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-white">
                                {stat.avgResolutionTime > 0
                                  ? `${stat.avgResolutionTime.toFixed(1)}h`
                                  : 'N/A'}
                              </span>
                              {stat.avgResolutionTime > 0 && getComparisonIndicator(stat.avgResolutionTime, avgResolution)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-400">
                              {stat.lastIncidentDate
                                ? new Date(stat.lastIncidentDate).toLocaleDateString()
                                : 'None'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{t('comparison.reliabilityScore')}</h3>
            <div className="space-y-4">
              {stats
                .map(stat => {
                  const score = (
                    stat.uptimePercentage * 0.5 +
                    (100 - (stat.totalIncidents / 10) * 100) * 0.3 +
                    (100 - (stat.criticalIncidents / 5) * 100) * 0.2
                  );
                  return { ...stat, score: Math.max(0, Math.min(100, score)) };
                })
                .sort((a, b) => b.score - a.score)
                .map((stat, index) => (
                  <div key={stat.provider.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
                        <span className="text-sm font-medium text-white">{stat.provider.name}</span>
                      </div>
                      <span className="text-lg font-bold text-blue-400">{stat.score.toFixed(1)}/100</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stat.score}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {!loading && selectedProviders.length === 0 && (
        <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-lg">
          <p className="text-gray-400">{t('comparison.noProviders')}</p>
        </div>
      )}
    </div>
  );
}
