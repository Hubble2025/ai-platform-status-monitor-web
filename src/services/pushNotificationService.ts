import { supabase } from '../lib/supabase';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreferences {
  providerIds: string[];
  severityFilter: 'critical' | 'major' | 'all';
  notifyOnStart: boolean;
  notifyOnResolved: boolean;
}

const getSessionId = (): string => {
  let sessionId = localStorage.getItem('push_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('push_session_id', sessionId);
  }
  return sessionId;
};

export const pushNotificationService = {
  async checkSupport(): Promise<boolean> {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  },

  async requestPermission(): Promise<boolean> {
    const isSupported = await this.checkSupport();
    if (!isSupported) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribe(preferences: NotificationPreferences): Promise<void> {
    const permission = await this.checkPermission();
    if (permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Notification permission denied');
      }
    }

    const registration = await navigator.serviceWorker.ready;

    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
    }

    const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicVapidKey || undefined,
    });

    const subscriptionJson = subscription.toJSON();
    const sessionId = getSessionId();

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        session_id: sessionId,
        endpoint: subscriptionJson.endpoint!,
        p256dh_key: subscriptionJson.keys!.p256dh!,
        auth_key: subscriptionJson.keys!.auth!,
        provider_ids: preferences.providerIds,
        severity_filter: preferences.severityFilter,
        notify_on_start: preferences.notifyOnStart,
        notify_on_resolved: preferences.notifyOnResolved,
      }, {
        onConflict: 'endpoint',
      });

    if (error) {
      throw new Error(`Failed to save subscription: ${error.message}`);
    }
  },

  async unsubscribe(): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const subscriptionJson = subscription.toJSON();

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscriptionJson.endpoint!);

      if (error) {
        console.error('Failed to delete subscription from database:', error);
      }

      await subscription.unsubscribe();
    }
  },

  async getSubscription(): Promise<PushSubscriptionData | null> {
    const isSupported = await this.checkSupport();
    if (!isSupported) return null;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return null;

    const json = subscription.toJSON();
    return {
      endpoint: json.endpoint!,
      keys: {
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
      },
    };
  },

  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null;
  },

  async getPreferences(): Promise<NotificationPreferences | null> {
    const subscription = await this.getSubscription();
    if (!subscription) return null;

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('provider_ids, severity_filter, notify_on_start, notify_on_resolved')
      .eq('endpoint', subscription.endpoint)
      .maybeSingle();

    if (error || !data) return null;

    return {
      providerIds: data.provider_ids || [],
      severityFilter: data.severity_filter as 'critical' | 'major' | 'all',
      notifyOnStart: data.notify_on_start,
      notifyOnResolved: data.notify_on_resolved,
    };
  },

  async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    const subscription = await this.getSubscription();
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .update({
        provider_ids: preferences.providerIds,
        severity_filter: preferences.severityFilter,
        notify_on_start: preferences.notifyOnStart,
        notify_on_resolved: preferences.notifyOnResolved,
      })
      .eq('endpoint', subscription.endpoint);

    if (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  },

  async testNotification(): Promise<void> {
    const permission = await this.checkPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('Test Notification', {
      body: 'Push notifications are working correctly!',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'test',
      requireInteraction: false,
    });
  },
};
