import { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, XCircle, Sparkles, TrendingUp, Star, MessageSquare } from 'lucide-react';
import { IncidentTimeline } from './IncidentTimeline';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { getFeedbackStats, type FeedbackStats } from '../services/feedbackService';
import { useTheme } from '../contexts/ThemeContext';
import type { Provider, Incident } from '../lib/database.types';

interface ProviderCardProps {
  provider: Provider & { auto_discovered?: boolean; reliability_score?: number };
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  activeIncidents: number;
  incidents: Incident[];
  onClick: () => void;
  onFavorite?: (providerId: string) => void;
  isFavorite?: boolean;
}

export function ProviderCard({ provider, status, activeIncidents, incidents, onClick, onFavorite, isFavorite }: ProviderCardProps) {
  const { t } = useTheme();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);

  useEffect(() => {
    loadFeedbackStats();
  }, [provider.id]);

  const loadFeedbackStats = async () => {
    const stats = await getFeedbackStats(provider.id);
    if (stats.total_reports > 0 || stats.issues_votes > 0 || stats.down_votes > 0) {
      setFeedbackStats(stats);
    }
  };

  const touchGestures = onFavorite ? useTouchGestures({
    onSwipeRight: () => {
      setIsAnimating(true);
      setSwipeOffset(60);
      setTimeout(() => {
        onFavorite(provider.id);
        setSwipeOffset(0);
        setIsAnimating(false);
      }, 300);
    },
    onTap: onClick,
  }) : {};
  const getStatusColor = () => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'outage':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (status === 'operational') return t('provider.allSystemsOperational');
    if (activeIncidents === 1) return `1 ${t('provider.activeIncident')}`;
    return `${activeIncidents} ${t('provider.activeIncidents')}`;
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {isFavorite && (
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-yellow-600 flex items-center justify-center z-0">
          <Star className="w-6 h-6 text-white fill-white" />
        </div>
      )}
      <button
        onClick={onClick}
        {...touchGestures}
        className="relative w-full bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-gray-900/50 text-left group touch-manipulation"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isAnimating ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${getStatusColor()} m-4`} />

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white group-hover:text-gray-200">
              {provider.name}
            </h3>
            {provider.auto_discovered && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 border border-blue-800 text-blue-400 text-xs font-medium rounded">
                <Sparkles className="w-3 h-3" />
                {t('provider.autoDiscovered')}
              </span>
            )}
            {provider.reliability_score !== undefined && provider.reliability_score >= 0.95 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-900/30 border border-green-800 text-green-400 text-xs font-medium rounded">
                <TrendingUp className="w-3 h-3" />
                {(provider.reliability_score * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            {getStatusIcon()}
            <span className={`${
              status === 'operational' ? 'text-green-400' :
              status === 'degraded' ? 'text-yellow-400' :
              status === 'outage' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-3 -mx-2">
        <IncidentTimeline incidents={incidents} />
      </div>

      {feedbackStats && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-orange-900/20 border border-orange-800 rounded-lg">
          <MessageSquare className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span className="text-xs text-orange-400">
            {feedbackStats.total_reports > 0 && (
              <span className="font-medium">{feedbackStats.total_reports} {feedbackStats.total_reports > 1 ? t('provider.userReports') : t('provider.userReport')}</span>
            )}
            {feedbackStats.total_reports > 0 && (feedbackStats.issues_votes > 0 || feedbackStats.down_votes > 0) && ' • '}
            {(feedbackStats.issues_votes > 0 || feedbackStats.down_votes > 0) && (
              <span>{feedbackStats.issues_votes + feedbackStats.down_votes} {(feedbackStats.issues_votes + feedbackStats.down_votes) > 1 ? t('provider.issueVotes') : t('provider.issueVote')}</span>
            )}
          </span>
        </div>
      )}

      {provider.last_checked && (
        <div className="text-xs text-gray-500">
          {t('provider.lastChecked')}: {new Date(provider.last_checked).toLocaleString()}
        </div>
      )}
      </button>
    </div>
  );
}
