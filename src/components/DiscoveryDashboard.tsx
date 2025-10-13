import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, XCircle, Clock, TrendingUp, Activity, Loader2, Play, BarChart3 } from 'lucide-react';
import { platformDiscoveryService, PlatformRegistry, DiscoveryLog } from '../services/platformDiscoveryService';

export function DiscoveryDashboard() {
  const [platforms, setPlatforms] = useState<PlatformRegistry[]>([]);
  const [logs, setLogs] = useState<DiscoveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();

    const subscription = platformDiscoveryService.subscribeToRegistry((newPlatforms) => {
      setPlatforms(newPlatforms);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    try {
      const [platformsData, logsData] = await Promise.all([
        platformDiscoveryService.getPlatformRegistry(),
        platformDiscoveryService.getDiscoveryLogs(20),
      ]);
      setPlatforms(platformsData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load discovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (platformId: string) => {
    try {
      await platformDiscoveryService.activatePlatform(platformId);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to activate platform');
    }
  };

  const handleDeactivate = async (platformId: string) => {
    try {
      await platformDiscoveryService.deactivatePlatform(platformId);
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to deactivate platform');
    }
  };

  const handleVerify = async (platform: PlatformRegistry) => {
    setVerifying(platform.id);
    try {
      await platformDiscoveryService.verifyPlatform(
        platform.name,
        platform.status_page_url || platform.status_api_url
      );
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Verification failed');
    } finally {
      setVerifying(null);
    }
  };

  const filteredPlatforms = platforms.filter((platform) => {
    const matchesFilter =
      filter === 'all' || platform.verification_status === filter;
    const matchesSearch =
      !searchTerm ||
      platform.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: platforms.length,
    active: platforms.filter((p) => p.is_active).length,
    pending: platforms.filter((p) => p.verification_status === 'pending').length,
    verified: platforms.filter((p) => p.verification_status === 'verified').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Discovery Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage auto-discovered platforms and verification queue
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Platforms</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Verified</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.verified}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search platforms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'pending', 'verified', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Platform Registry
        </h3>

        {filteredPlatforms.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              No platforms found matching your criteria
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPlatforms.map((platform) => (
              <div
                key={platform.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {platform.name}
                      </h4>
                      {platform.is_active && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                          Active
                        </span>
                      )}
                      {platform.auto_discovered && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
                          Auto-discovered
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">API Type:</span> {platform.api_type}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Status:</span>{' '}
                        <span
                          className={
                            platform.verification_status === 'verified'
                              ? 'text-green-600 dark:text-green-400'
                              : platform.verification_status === 'failed'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }
                        >
                          {platform.verification_status}
                        </span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Reliability:</span>{' '}
                        {(platform.reliability_score * 100).toFixed(1)}%{' '}
                        <span className="text-xs">
                          ({platform.success_count}/{platform.check_count} checks)
                        </span>
                      </p>
                      {platform.status_page_url && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">URL:</span>{' '}
                          <a
                            href={platform.status_page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {platform.status_page_url}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {platform.verification_status === 'pending' && (
                      <button
                        onClick={() => handleVerify(platform)}
                        disabled={verifying === platform.id}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {verifying === platform.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Verify
                      </button>
                    )}

                    {platform.verification_status === 'verified' && !platform.is_active && (
                      <button
                        onClick={() => handleActivate(platform.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Activate
                      </button>
                    )}

                    {platform.is_active && (
                      <button
                        onClick={() => handleDeactivate(platform.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Discovery Logs
        </h3>

        {logs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No discovery logs yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {log.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {log.platform_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.success ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {log.error_message || JSON.stringify(log.metadata).slice(0, 50)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
