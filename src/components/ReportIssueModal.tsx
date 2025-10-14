import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { submitIssueReport } from '../services/feedbackService';
import { useTheme } from '../contexts/ThemeContext';
import type { IssueReport } from '../services/feedbackService';

interface ReportIssueModalProps {
  providerId: string;
  providerName: string;
  onClose: () => void;
}

export function ReportIssueModal({ providerId, providerName, onClose }: ReportIssueModalProps) {
  const { theme } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    category: 'performance' as IssueReport['category'],
    severity: 'minor' as IssueReport['severity'],
    title: '',
    description: '',
    affected_features: '',
    contact_email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    const result = await submitIssueReport(providerId, {
      category: formData.category,
      severity: formData.severity,
      title: formData.title.trim(),
      description: formData.description.trim(),
      affected_features: formData.affected_features
        ? formData.affected_features.split(',').map(f => f.trim()).filter(Boolean)
        : undefined,
      contact_email: formData.contact_email.trim() || undefined
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } else {
      setError(result.error || 'Failed to submit report');
    }

    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <div
          className={`max-w-md w-full rounded-lg p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Report Submitted!</h3>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Thank you for helping the community
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div
        className={`max-w-2xl w-full rounded-lg p-6 my-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Report Issue - {providerName}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as IssueReport['category'] })}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="performance">Performance Issues</option>
              <option value="outage">Service Outage</option>
              <option value="api_issues">API Issues</option>
              <option value="feature_problems">Feature Problems</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Severity <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {(['minor', 'major', 'critical'] as const).map(severity => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => setFormData({ ...formData, severity })}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    formData.severity === severity
                      ? severity === 'critical'
                        ? 'bg-red-500 text-white border-red-500'
                        : severity === 'major'
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-blue-500 text-white border-blue-500'
                      : theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the issue"
              maxLength={100}
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the issue you're experiencing..."
              rows={4}
              maxLength={500}
              className={`w-full px-4 py-2 rounded-lg border resize-none ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              {formData.description.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Affected Features (optional)
            </label>
            <input
              type="text"
              value={formData.affected_features}
              onChange={e => setFormData({ ...formData, affected_features: e.target.value })}
              placeholder="e.g., GPT-4, Image Generation (comma separated)"
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email (optional)
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="your@email.com (for updates)"
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {error && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 hover:bg-gray-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
