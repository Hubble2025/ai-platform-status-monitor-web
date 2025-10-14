import { useEffect, useState } from 'react';
import { ArrowLeft, Activity, Clock, AlertCircle, Flag } from 'lucide-react';
import { fetchProviderWithIncidents } from '../services/providerService';
import { IncidentBadge } from './IncidentBadge';
import { ProviderInfoSection } from './ProviderInfoSection';
import { FeedbackVoting } from './FeedbackVoting';
import { CommunityReports } from './CommunityReports';
import { ReportIssueModal } from './ReportIssueModal';
import { IncidentHistoryChart } from './IncidentHistoryChart';
import { useTheme } from '../contexts/ThemeContext';
import type { ProviderWithIncidents } from '../lib/database.types';
import { Loader2 } from 'lucide-react';

interface ProviderDetailProps {
  slug: string;
  onBack: () => void;
}

export function ProviderDetail({ slug, onBack }: ProviderDetailProps) {
  const { t, isDarkMode } = useTheme();
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
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('detail.providerNotFound')}</p>
        <button
          onClick={onBack}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          {t('detail.goBack')}
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
        className={`flex items-center gap-2 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
      >
        <ArrowLeft className="w-4 h-4" />
        {t('detail.backToDashboard')}
      </button>

      <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-300'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{provider.name}</h1>
            <div className={`flex items-center gap-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {provider.status_url && (
                <a
                  href={provider.status_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  {t('detail.officialStatusPage')} →
                </a>
              )}
              {provider.last_checked && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {t('provider.lastChecked')}: {new Date(provider.last_checked).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            {activeIncidents.length === 0 ? (
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                <Activity className="w-5 h-5" />
                <span className="font-medium">{t('provider.allSystemsOperational')}</span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{activeIncidents.length} {t('detail.activeIncidents')}</span>
              </div>
            )}
          </div>
        </div>

        {provider.latest_check && (
          <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-300'}`}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('detail.responseTime')}:</span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {provider.latest_check.response_time}ms
                </span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('detail.status')}:</span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
          <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            {t('detail.activeIncidents')}
          </h2>
          <div className="space-y-3">
            {activeIncidents.map((incident) => (
              <div
                key={incident.id}
                className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-300'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{incident.title}</h3>
                  <IncidentBadge severity={incident.severity} status={incident.status} />
                </div>

                {incident.description && (
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4>{incident.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {incident.component && (
                    <div>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('detail.component')}:</span>
                      <span className={`ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{incident.component}</span>
                    </div>
                  )}
                  {incident.started_at && (
                    <div>
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('detail.started')}:</span>
                      <span className={`ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(incident.started_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {incident.regions.length > 0 && (
                    <div className="col-span-2">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('detail.affectedRegions')}:</span>
                      <span className={`ml-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{incident.regions.join(', ')}</span>
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
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('detail.incidentHistory')}</h2>
          <div className="space-y-3">
            {resolvedIncidents.map((incident) => (
              <div
                key={incident.id}
                className={`rounded-lg p-4 opacity-75 ${isDarkMode ? 'bg-gray-900/50 border border-gray-800' : 'bg-white border border-gray-300'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{incident.title}</h3>
                  <IncidentBadge severity={incident.severity} status="resolved" />
                </div>

                {incident.description && (
                  <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{incident.description}</p>
                )}

                <div className={`flex gap-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  {incident.started_at && (
                    <span>{t('incident.started')}: {new Date(incident.started_at).toLocaleString()}</span>
                  )}
                  {incident.resolved_at && (
                    <span>{t('incident.resolved')}: {new Date(incident.resolved_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!provider.incidents || provider.incidents.length === 0 && (
        <div className={`text-center py-12 rounded-lg ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-300'}`}>
          <Activity className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('detail.noIncidents')}</p>
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
            {t('report.reportIssue')}
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
