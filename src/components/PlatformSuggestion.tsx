import React, { useState, useEffect } from 'react';
import { Plus, ThumbsUp, ExternalLink, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { platformDiscoveryService, PlatformSuggestion as SuggestionType } from '../services/platformDiscoveryService';

export function PlatformSuggestion() {
  const [suggestions, setSuggestions] = useState<SuggestionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [votedSuggestions, setVotedSuggestions] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    platform_name: '',
    status_url: '',
    reason: '',
  });

  useEffect(() => {
    loadSuggestions();
    loadVotes();

    const subscription = platformDiscoveryService.subscribeToSuggestions((newSuggestions) => {
      setSuggestions(newSuggestions);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await platformDiscoveryService.getSuggestions({ limit: 50 });
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVotes = async () => {
    try {
      const suggestions = await platformDiscoveryService.getSuggestions();
      const voted = new Set<string>();

      for (const suggestion of suggestions) {
        const hasVoted = await platformDiscoveryService.hasVoted(suggestion.id);
        if (hasVoted) {
          voted.add(suggestion.id);
        }
      }

      setVotedSuggestions(voted);
    } catch (error) {
      console.error('Failed to load votes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await platformDiscoveryService.submitSuggestion(formData);
      setFormData({ platform_name: '', status_url: '', reason: '' });
      setShowForm(false);
      await loadSuggestions();
    } catch (error: any) {
      alert(error.message || 'Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (suggestionId: string) => {
    try {
      const hasVoted = votedSuggestions.has(suggestionId);

      if (hasVoted) {
        await platformDiscoveryService.unvoteSuggestion(suggestionId);
        setVotedSuggestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(suggestionId);
          return newSet;
        });
      } else {
        await platformDiscoveryService.voteSuggestion(suggestionId);
        setVotedSuggestions(prev => new Set(prev).add(suggestionId));
      }

      await loadSuggestions();
    } catch (error: any) {
      alert(error.message || 'Failed to vote');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'added':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'added':
        return 'Added to Monitor';
      default:
        return status;
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Suggest a Platform
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Help us expand our monitoring by suggesting new AI platforms
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Suggest Platform
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                required
                value={formData.platform_name}
                onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                placeholder="e.g., OpenAI, Anthropic"
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status Page URL
              </label>
              <input
                type="url"
                required
                value={formData.status_url}
                onChange={(e) => setFormData({ ...formData, status_url: e.target.value })}
                placeholder="https://status.example.com"
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Must be a valid status page (e.g., statuspage.io, Atlassian, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Why should we monitor this platform?"
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Suggestion
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Community Suggestions
        </h3>

        {suggestions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              No suggestions yet. Be the first to suggest a platform!
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {suggestion.platform_name}
                      </h4>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(suggestion.status)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getStatusText(suggestion.status)}
                        </span>
                      </div>
                    </div>

                    <a
                      href={suggestion.status_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mb-2"
                    >
                      {suggestion.status_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {suggestion.reason && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {suggestion.reason}
                      </p>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                      Suggested {new Date(suggestion.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleVote(suggestion.id)}
                    disabled={suggestion.status !== 'pending'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      votedSuggestions.has(suggestion.id)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="font-semibold">{suggestion.upvotes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
