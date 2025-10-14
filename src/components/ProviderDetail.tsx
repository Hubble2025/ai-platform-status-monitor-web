import { useEffect, useState } from 'react';
import { ArrowLeft, Activity, Clock, AlertCircle, Flag } from 'lucide-react';
import { fetchProviderWithIncidents } from '../services/providerService';
import { IncidentBadge } from './IncidentBadge';
import { ProviderInfoSection } from './ProviderInfoSection';
import { FeedbackVoting } from './FeedbackVoting';
import { CommunityReports } from './CommunityReports';
import { ReportIssueModal } from './ReportIssueModal';
import { IncidentHistoryChart } from './IncidentHistoryChart';
import type { ProviderWithIncidents } from '../lib/database.types';
import { Loader2 } from 'lucide-react';

interface ProviderDetailProps {
  slug: string;
  onBack: () => void;
}

export function ProviderDetail({ slug, onBack }: ProviderDetailProps) {
  const [provider, setProvider] = useState<ProviderWithIncidents | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    async function loadProvider() {
      try {
        const data = await fetchProviderWithIncidents(slug);
        setProvider(data);
      } catch (error) {
        console.error('Failed to load provider:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProvider();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Provider not found</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          Go back
        </button>
      </div>
    );
  }

  const activeIncidents = provider.incidents?.filter(i => !i.resolved_at) || [];
  const resolvedIncidents = provider.incidents?.filter(i => i.resolved_at) || [];

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{provider.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              {provider.status_url && (
                <a
                  href={provider.status_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  Official Status Page →
                </a>
              )}
              {provider.last_checked && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last checked: {new Date(provider.last_checked).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            {activeIncidents.length === 0 ? (
              <div className="flex items-center gap-2 text-green-400">
                <Activity className="w-5 h-5" />
                <span className="font-medium">All Systems Operational</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{activeIncidents.length} Active Incidents</span>
              </div>
            )}
          </div>
        </div>

        {provider.latest_check && (
          <div className="pt-4 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Response Time:</span>
                <span className="ml-2 text-white font-medium">
                  {provider.latest_check.response_time}ms
                </span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="ml-2 text-white font-medium">
                  {provider.latest_check.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <IncidentHistoryChart providerId={provider.id} />

      {activeIncidents.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Active Incidents
          </h2>
          <div className="space-y-3">
            {activeIncidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{incident.title}</h3>
                  <IncidentBadge severity={incident.severity} status={incident.status} />
                </div>

                {incident.description && (
                  <p className="text-gray-300 mb-4">{incident.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {incident.component && (
                    <div>
                      <span className="text-gray-400">Component:</span>
                      <span className="ml-2 text-white">{incident.component}</span>
                    </div>
                  )}
                  {incident.started_at && (
                    <div>
                      <span className="text-gray-400">Started:</span>
                      <span className="ml-2 text-white">
                        {new Date(incident.started_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {incident.regions.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Affected Regions:</span>
                      <span className="ml-2 text-white">{incident.regions.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resolvedIncidents.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Incident History</h2>
          <div className="space-y-3">
            {resolvedIncidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 opacity-75"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-white">{incident.title}</h3>
                  <IncidentBadge severity={incident.severity} status="resolved" />
                </div>

                {incident.description && (
                  <p className="text-sm text-gray-400 mb-3">{incident.description}</p>
                )}

                <div className="flex gap-4 text-xs text-gray-500">
                  {incident.started_at && (
                    <span>Started: {new Date(incident.started_at).toLocaleString()}</span>
                  )}
                  {incident.resolved_at && (
                    <span>Resolved: {new Date(incident.resolved_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!provider.incidents || provider.incidents.length === 0 && (
        <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-lg">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No incidents recorded for this provider</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <FeedbackVoting providerId={provider.id} />

          <button
            onClick={() => setShowReportModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Flag className="w-4 h-4" />
            Report an Issue
          </button>
        </div>

        <CommunityReports providerId={provider.id} />
      </div>

      <ProviderInfoSection providerId={provider.id} />

      {showReportModal && (
        <ReportIssueModal
          providerId={provider.id}
          providerName={provider.name}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
