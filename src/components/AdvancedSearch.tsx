import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Calendar, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { IncidentBadge } from './IncidentBadge';
import type { Provider, Incident } from '../lib/database.types';

interface AdvancedSearchProps {
  onBack: () => void;
  providers: Provider[];
}

interface SearchFilters {
  query: string;
  providerIds: string[];
  severity: string[];
  status: 'all' | 'active' | 'resolved';
  dateRange: 'all' | '24h' | '7d' | '30d' | 'custom';
  customStart: string;
  customEnd: string;
}

export function AdvancedSearch({ onBack, providers }: AdvancedSearchProps) {
  const { t } = useTheme();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    providerIds: [],
    severity: [],
    status: 'all',
    dateRange: '30d',
    customStart: '',
    customEnd: '',
  });
  const [results, setResults] = useState<(Incident & { provider?: Provider })[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    searchIncidents();
  }, [filters.providerIds, filters.severity, filters.status, filters.dateRange]);

  async function searchIncidents() {
    setLoading(true);
    try {
      let query = supabase.from('incidents').select('*');

      if (filters.providerIds.length > 0) {
        query = query.in('provider_id', filters.providerIds);
      }

      if (filters.severity.length > 0) {
        query = query.in('severity', filters.severity);
      }

      if (filters.status === 'active') {
        query = query.is('resolved_at', null);
      } else if (filters.status === 'resolved') {
        query = query.not('resolved_at', 'is', null);
      }

      const now = new Date();
      if (filters.dateRange !== 'all') {
        let startDate: Date;
        if (filters.dateRange === 'custom' && filters.customStart) {
          startDate = new Date(filters.customStart);
        } else {
          const hours = filters.dateRange === '24h' ? 24 : filters.dateRange === '7d' ? 168 : 720;
          startDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
        }
        query = query.gte('created_at', startDate.toISOString());
      }

      if (filters.dateRange === 'custom' && filters.customEnd) {
        query = query.lte('created_at', new Date(filters.customEnd).toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(100);

      if (error) throw error;

      let filtered = data || [];

      if (filters.query) {
        const lowerQuery = filters.query.toLowerCase();
        filtered = filtered.filter(inc =>
          inc.title.toLowerCase().includes(lowerQuery) ||
          inc.description?.toLowerCase().includes(lowerQuery) ||
          inc.component?.toLowerCase().includes(lowerQuery)
        );
      }

      const withProviders = filtered.map(inc => ({
        ...inc,
        provider: providers.find(p => p.id === inc.provider_id),
      }));

      setResults(withProviders);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    searchIncidents();
  }

  function toggleProvider(id: string) {
    setFilters(prev => ({
      ...prev,
      providerIds: prev.providerIds.includes(id)
        ? prev.providerIds.filter(pid => pid !== id)
        : [...prev.providerIds, id],
    }));
  }

  function toggleSeverity(sev: string) {
    setFilters(prev => ({
      ...prev,
      severity: prev.severity.includes(sev)
        ? prev.severity.filter(s => s !== sev)
        : [...prev.severity, sev],
    }));
  }

  function clearFilters() {
    setFilters({
      query: '',
      providerIds: [],
      severity: [],
      status: 'all',
      dateRange: '30d',
      customStart: '',
      customEnd: '',
    });
  }

  const activeFiltersCount =
    filters.providerIds.length +
    filters.severity.length +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.dateRange !== '30d' ? 1 : 0);

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Advanced Search</h1>
        <p className="text-gray-400">Search and filter incidents across all providers</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search incidents by title, description, or component..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors relative"
          >
            <Filter className="w-5 h-5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">Providers</label>
                {filters.providerIds.length > 0 && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, providerIds: [] }))}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {providers.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => toggleProvider(provider.id)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.providerIds.includes(provider.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {provider.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block">Severity</label>
                <div className="space-y-2">
                  {['critical', 'major', 'minor'].map(sev => (
                    <button
                      key={sev}
                      onClick={() => toggleSeverity(sev)}
                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.severity.includes(sev)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block">Status</label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'active', label: 'Active' },
                    { value: 'resolved', label: 'Resolved' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFilters(prev => ({ ...prev, status: value as any }))}
                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.status === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block">Time Range</label>
                <div className="space-y-2">
                  {[
                    { value: 'all', label: 'All Time' },
                    { value: '24h', label: 'Last 24 Hours' },
                    { value: '7d', label: 'Last 7 Days' },
                    { value: '30d', label: 'Last 30 Days' },
                    { value: 'custom', label: 'Custom' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFilters(prev => ({ ...prev, dateRange: value as any }))}
                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.dateRange === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Start Date</label>
                  <input
                    type="date"
                    value={filters.customStart}
                    onChange={(e) => setFilters(prev => ({ ...prev, customStart: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">End Date</label>
                  <input
                    type="date"
                    value={filters.customEnd}
                    onChange={(e) => setFilters(prev => ({ ...prev, customEnd: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>
            )}

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Results ({results.length})
          </h2>
          {loading && <span className="text-sm text-gray-400">Searching...</span>}
        </div>

        {results.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            No incidents found matching your criteria
          </div>
        )}

        <div className="space-y-3">
          {results.map(incident => (
            <div
              key={incident.id}
              className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-blue-400">
                      {incident.provider?.name}
                    </span>
                    <IncidentBadge severity={incident.severity || 'minor'} />
                    {incident.resolved_at ? (
                      <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-400 rounded">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-red-900/50 text-red-400 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-medium mb-1">{incident.title}</h3>
                  {incident.description && (
                    <p className="text-sm text-gray-400 mb-2">{incident.description}</p>
                  )}
                  {incident.component && (
                    <span className="text-xs text-gray-500">Component: {incident.component}</span>
                  )}
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(incident.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs mt-1">
                    {new Date(incident.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
