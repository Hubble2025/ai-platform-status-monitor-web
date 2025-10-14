import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { submitVote, getFeedbackStats, type FeedbackStats } from '../services/feedbackService';
import { useTheme } from '../contexts/ThemeContext';

interface FeedbackVotingProps {
  providerId: string;
}

export function FeedbackVoting({ providerId }: FeedbackVotingProps) {
  const { theme } = useTheme();
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [voting, setVoting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadStats();
  }, [providerId]);

  const loadStats = async () => {
    const data = await getFeedbackStats(providerId);
    setStats(data);
  };

  const handleVote = async (voteType: 'working' | 'having_issues' | 'down') => {
    setVoting(true);
    setMessage(null);

    const result = await submitVote(providerId, voteType);

    if (result.success) {
      setMessage({ type: 'success', text: t('feedback.thanksForFeedback') });
      await loadStats();
    } else {
      setMessage({ type: 'error', text: result.error || t('feedback.failedToSubmit') });
    }

    setVoting(false);
    setTimeout(() => setMessage(null), 3000);
  };

  if (!stats) return null;

  const totalVotes = stats.working_votes + stats.issues_votes + stats.down_votes;
  const hasIssues = stats.issues_votes > 0 || stats.down_votes > 0 || stats.total_reports > 0;

  return (
    <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <h3 className="text-sm font-semibold mb-3">{t('feedback.communityFeedback')}</h3>

      {hasIssues && stats.total_reports > 0 && (
        <div className={`flex items-center gap-2 mb-3 p-2 rounded ${theme === 'dark' ? 'bg-orange-900/20 text-orange-400' : 'bg-orange-50 text-orange-700'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs">
            {stats.total_reports} {stats.total_reports > 1 ? t('provider.userReports') : t('provider.userReport')} {t('feedback.reportedIssues')}
            {stats.critical_reports > 0 && ` (${stats.critical_reports} ${t('feedback.critical')})`}
          </span>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => handleVote('working')}
          disabled={voting}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded transition-colors ${
            theme === 'dark'
              ? 'bg-green-900/20 hover:bg-green-900/30 text-green-400'
              : 'bg-green-50 hover:bg-green-100 text-green-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-xs font-medium">{stats.working_votes}</span>
        </button>

        <button
          onClick={() => handleVote('having_issues')}
          disabled={voting}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded transition-colors ${
            theme === 'dark'
              ? 'bg-orange-900/20 hover:bg-orange-900/30 text-orange-400'
              : 'bg-orange-50 hover:bg-orange-100 text-orange-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{stats.issues_votes}</span>
        </button>

        <button
          onClick={() => handleVote('down')}
          disabled={voting}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded transition-colors ${
            theme === 'dark'
              ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400'
              : 'bg-red-50 hover:bg-red-100 text-red-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-xs font-medium">{stats.down_votes}</span>
        </button>
      </div>

      {totalVotes > 0 && (
        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {totalVotes} {totalVotes > 1 ? t('feedback.votes') : t('feedback.vote')} {t('feedback.votesInLast2Hours')}
        </p>
      )}

      {message && (
        <div className={`mt-3 p-2 rounded text-xs ${
          message.type === 'success'
            ? theme === 'dark' ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'
            : theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
