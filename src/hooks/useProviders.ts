import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchProviders } from '../services/providerService';
import type { Provider } from '../lib/database.types';

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProviders() {
      try {
        const data = await fetchProviders();
        if (mounted) {
          setProviders(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProviders();

    const channel = supabase
      .channel('providers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'providers',
        },
        () => {
          loadProviders();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, []);

  return { providers, loading, error };
}
