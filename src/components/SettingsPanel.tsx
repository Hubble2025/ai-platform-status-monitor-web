import { useState, useEffect } from 'react';
import { X, Bell, Mail, Save, Sparkles, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Provider, UserSubscription } from '../lib/database.types';
import { NotificationSettings } from './NotificationSettings';
import { PlatformSuggestion } from './PlatformSuggestion';
import { DiscoveryDashboard } from './DiscoveryDashboard';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsPanelProps {
  providers: Provider[];
  onClose: () => void;
}

export function SettingsPanel({ providers, onClose }: SettingsPanelProps) {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'notifications' | 'suggestions' | 'discovery'>('notifications');
  const [email, setEmail] = useState('');
  const [alertThreshold, setAlertThreshold] = useState<'minor' | 'major' | 'critical'>('major');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEmail(data.email || '');
        setAlertThreshold(data.alert_threshold as 'minor' | 'major' | 'critical');
        setSelectedProviders(data.subscribed_providers);
        setNotificationsEnabled(data.is_active);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .maybeSingle();

      const subscription: Partial<UserSubscription> = {
        email: email || null,
        alert_threshold: alertThreshold,
        subscribed_providers: selectedProviders,
        is_active: notificationsEnabled,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update(subscription)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({
            ...subscription,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  function toggleProvider(providerId: string) {
    setSelectedProviders(prev =>
      prev.includes(providerId)
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  }

  function selectAll() {
    setSelectedProviders(providers.map(p => p.id));
  }

  function deselectAll() {
    setSelectedProviders([]);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
        isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <div className={`sticky top-0 ${
          isDarkMode ? 'bg-gray-900 border-b border-gray-800' : 'bg-white border-b border-gray-200'
        }`}>
          <div className="p-6 flex items-center justify-between">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pb-4 flex gap-2">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'notifications'
                  ? 'bg-blue-600 text-white'
                  : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'suggestions'
                  ? 'bg-blue-600 text-white'
                  : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Suggest Platform
            </button>
            <button
              onClick={() => setActiveTab('discovery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'discovery'
                  ? 'bg-blue-600 text-white'
                  : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Database className="w-4 h-4" />
              Discovery
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {message && activeTab === 'notifications' && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-900/30 border border-green-800 text-green-400'
                  : 'bg-red-900/30 border border-red-800 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === 'suggestions' && <PlatformSuggestion />}

          {activeTab === 'discovery' && <DiscoveryDashboard />}

          {activeTab === 'notifications' && (
            <>
              <NotificationSettings providers={providers.map(p => ({ id: p.id, name: p.name }))} />

          <div className={`h-px ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`} />

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-gray-400" />
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Alerts (Legacy)</h3>
            </div>

            <label className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-gray-900"
              />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Enable email notifications for incidents</span>
            </label>

            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Alert Threshold
                </label>
                <select
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value as 'minor' | 'major' | 'critical')}
                  className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white border border-gray-300 text-gray-900'}`}
                  disabled={!notificationsEnabled}
                >
                  <option value="minor">Minor and above</option>
                  <option value="major">Major and critical only</option>
                  <option value="critical">Critical only</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-gray-400" />
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Address</h3>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={!notificationsEnabled}
              className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'}`}
            />
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Receive email alerts when incidents occur (optional)
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monitored Providers</h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-400 hover:text-blue-300"
                  disabled={!notificationsEnabled}
                >
                  Select All
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={deselectAll}
                  className="text-sm text-blue-400 hover:text-blue-300"
                  disabled={!notificationsEnabled}
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {providers.map((provider) => (
                <label
                  key={provider.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    selectedProviders.includes(provider.id)
                      ? isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-300'
                      : isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'
                  } ${!notificationsEnabled ? 'opacity-50' : isDarkMode ? 'cursor-pointer hover:border-gray-600' : 'cursor-pointer hover:border-gray-400'}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProviders.includes(provider.id)}
                    onChange={() => toggleProvider(provider.id)}
                    disabled={!notificationsEnabled}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-gray-900"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{provider.name}</span>
                </label>
              ))}
            </div>
          </div>
            </>
          )}
        </div>

        {activeTab === 'notifications' && (
          <div className={`sticky bottom-0 p-6 ${isDarkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t border-gray-200'}`}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
