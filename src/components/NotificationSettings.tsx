import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, TestTube2 } from 'lucide-react';
import { pushNotificationService, NotificationPreferences } from '../services/pushNotificationService';
import { useTheme } from '../contexts/ThemeContext';

interface NotificationSettingsProps {
  providers: Array<{ id: string; name: string }>;
}

export function NotificationSettings({ providers }: NotificationSettingsProps) {
  const { t, isDarkMode } = useTheme();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    providerIds: [],
    severityFilter: 'critical',
    notifyOnStart: true,
    notifyOnResolved: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    setIsLoading(true);
    try {
      const supported = await pushNotificationService.checkSupport();
      setIsSupported(supported);

      if (supported) {
        const subscribed = await pushNotificationService.isSubscribed();
        setIsSubscribed(subscribed);

        if (subscribed) {
          const prefs = await pushNotificationService.getPreferences();
          if (prefs) {
            setPreferences(prefs);
          }
        }
      }
    } catch (err) {
      console.error('Failed to check notification status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await pushNotificationService.subscribe(preferences);
      setIsSubscribed(true);
      setSuccess(t('notifications.enabled'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
      setSuccess(t('notifications.disabled'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreferences = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isSubscribed) {
        await pushNotificationService.updatePreferences(preferences);
      } else {
        await pushNotificationService.subscribe(preferences);
        setIsSubscribed(true);
      }
      setSuccess(t('notifications.updated'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setError(null);
    try {
      await pushNotificationService.testNotification();
      setSuccess(t('notifications.testSent'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test notification');
    }
  };

  const toggleProvider = (providerId: string) => {
    setPreferences((prev) => ({
      ...prev,
      providerIds: prev.providerIds.includes(providerId)
        ? prev.providerIds.filter((id) => id !== providerId)
        : [...prev.providerIds, providerId],
    }));
  };

  const selectAllProviders = () => {
    setPreferences((prev) => ({
      ...prev,
      providerIds: providers.map((p) => p.id),
    }));
  };

  const clearAllProviders = () => {
    setPreferences((prev) => ({
      ...prev,
      providerIds: [],
    }));
  };

  if (!isSupported) {
    return (
      <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <BellOff className="w-6 h-6 text-gray-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('settings.notifications')}
          </h3>
        </div>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          {t('notifications.notSupported')}
        </p>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-500" />
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('notifications.title')}
          </h3>
        </div>
        <button
          onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isSubscribed
              ? isDarkMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
              : isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? t('notifications.loading') : isSubscribed ? t('notifications.disable') : t('notifications.enable')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2">
          <X className="w-5 h-5 text-red-500" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-green-400 text-sm">{success}</span>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('notifications.severityFilter')}
          </label>
          <div className="flex gap-2">
            {(['critical', 'major', 'all'] as const).map((severity) => (
              <button
                key={severity}
                onClick={() => setPreferences((prev) => ({ ...prev, severityFilter: severity }))}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  preferences.severityFilter === severity
                    ? isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('notifications.notificationEvents')}
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifyOnStart}
                onChange={(e) =>
                  setPreferences((prev) => ({ ...prev, notifyOnStart: e.target.checked }))
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                {t('notifications.notifyOnStart')}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifyOnResolved}
                onChange={(e) =>
                  setPreferences((prev) => ({ ...prev, notifyOnResolved: e.target.checked }))
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                {t('notifications.notifyOnResolved')}
              </span>
            </label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('notifications.monitoredProviders')} ({preferences.providerIds.length === 0 ? t('search.all') : preferences.providerIds.length})
            </label>
            <div className="flex gap-2">
              <button
                onClick={selectAllProviders}
                className={`text-xs px-2 py-1 rounded ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('notifications.selectAll')}
              </button>
              <button
                onClick={clearAllProviders}
                className={`text-xs px-2 py-1 rounded ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('notifications.clear')}
              </button>
            </div>
          </div>
          <div className={`max-h-48 overflow-y-auto space-y-2 p-3 rounded-lg border ${
            isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            {providers.length === 0 ? (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('notifications.noProviders')}
              </p>
            ) : (
              providers.map((provider) => (
                <label key={provider.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      preferences.providerIds.length === 0 ||
                      preferences.providerIds.includes(provider.id)
                    }
                    onChange={() => toggleProvider(provider.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {provider.name}
                  </span>
                </label>
              ))
            )}
          </div>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {preferences.providerIds.length === 0
              ? t('notifications.allMonitored')
              : `${t('notifications.monitoring')} ${preferences.providerIds.length} ${preferences.providerIds.length !== 1 ? t('notifications.providers') : t('notifications.provider')}`}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleUpdatePreferences}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? t('notifications.saving') : t('notifications.savePreferences')}
          </button>
          {isSubscribed && (
            <button
              onClick={handleTestNotification}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <TestTube2 className="w-4 h-4" />
              {t('notifications.test')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
