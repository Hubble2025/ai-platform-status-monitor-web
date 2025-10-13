import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Provider } from '../lib/database.types';

function getSessionId(): string {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

export function useProviderOrder(providers: Provider[]) {
  const [orderedProviders, setOrderedProviders] = useState<Provider[]>(providers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviderOrder();
  }, [providers.length]);

  useEffect(() => {
    if (providers.length > 0) {
      applyOrder(providers);
    }
  }, [providers]);

  async function loadProviderOrder() {
    try {
      const sessionId = getSessionId();
      const { data, error } = await supabase
        .from('user_preferences')
        .select('provider_order')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;

      if (data && data.provider_order.length > 0) {
        applyOrder(providers, data.provider_order);
      } else {
        setOrderedProviders(providers);
      }
    } catch (error) {
      console.error('Failed to load provider order:', error);
      setOrderedProviders(providers);
    } finally {
      setLoading(false);
    }
  }

  function applyOrder(providerList: Provider[], order?: string[]) {
    if (!order || order.length === 0) {
      setOrderedProviders(providerList);
      return;
    }

    const ordered = [...providerList].sort((a, b) => {
      const indexA = order.indexOf(a.id);
      const indexB = order.indexOf(b.id);

      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });

    setOrderedProviders(ordered);
  }

  async function saveProviderOrder(newOrder: Provider[]) {
    try {
      const sessionId = getSessionId();
      const providerIds = newOrder.map(p => p.id);

      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_preferences')
          .update({
            provider_order: providerIds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_preferences')
          .insert({
            session_id: sessionId,
            provider_order: providerIds,
          });
      }

      setOrderedProviders(newOrder);
    } catch (error) {
      console.error('Failed to save provider order:', error);
    }
  }

  return {
    orderedProviders,
    saveProviderOrder,
    loading,
  };
}
