import { useState, useEffect } from 'react';
import { ThumbsUp, AlertCircle, Clock } from 'lucide-react';
import { getIssueReports, upvoteReport, type IssueReport } from '../services/feedbackService';
import { useTheme } from '../contexts/ThemeContext';

interface CommunityReportsProps {
  providerId: string;
}

export function CommunityReports({ providerId }: CommunityReportsProps) {
  const { theme } = useTheme();
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [providerId]);

  const loadReports = async () => {
    setLoading(true);
    const data = await getIssueReports(providerId);
    setReports(data);
    setLoading(false);
  };

  const handleUpvote = async (reportId: string) => {
    setUpvoting(reportId);
    const result = await upvoteReport(reportId);

    if (result.success) {
      await loadReports();
    }

    setUpvoting(null);
  };

  const getCategoryLabel = (category: IssueReport['category']) => {
    const labels = {
      performance: t('report.categories.performance'),
      outage: t('report.categories.outage'),
      api_issues: t('report.categories.api_issues'),
      feature_problems: t('report.categories.feature_problems'),
      other: t('report.categories.other')
    };
    return labels[category];
  };

  const getSeverityColor = (severity: IssueReport['severity']) => {
    if (severity === 'critical') return theme === 'dark' ? 'text-red-400 bg-red-900/20' : 'text-red-700 bg-red-50';
    if (severity === 'major') return theme === 'dark' ? 'text-orange-400 bg-orange-900/20' : 'text-orange-700 bg-orange-50';
    return theme === 'dark' ? 'text-blue-400 bg-blue-900/20' : 'text-blue-700 bg-blue-50';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ${t('communityReports.ago')}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${t('communityReports.ago')}`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${t('communityReports.ago')}`;
  };

  if (loading) {
    return (
      <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4`}></div>
          <div className={`h-20 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
          <div className={`h-20 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold">{t('communityReports.title')}</h3>
        </div>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          {t('communityReports.noReports')}
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold">{t('communityReports.title')}</h3>
        </div>
        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {reports.length} {reports.length > 1 ? t('communityReports.activeReports') : t('communityReports.activeReport')}
        </span>
      </div>

      <div className="space-y-3">
        {reports.map(report => (
          <div
            key={report.id}
            className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(report.severity)}`}>
                    {report.severity.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}>
                    {getCategoryLabel(report.category)}
                  </span>
                  {report.status === 'validated' && (
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'}`}>
                      {t('communityReports.validated')}
                    </span>
                  )}
                </div>
                <h4 className="font-medium text-sm mb-1">{report.title}</h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                  {report.description}
                </p>
                {report.affected_features && report.affected_features.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {(report.affected_features as string[]).slice(0, 3).map((feature, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'}`}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleUpvote(report.id)}
                disabled={upvoting === report.id}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-white hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs font-medium">{report.upvotes}</span>
              </button>
            </div>

            <div className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(report.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
