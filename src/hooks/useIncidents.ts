import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchActiveIncidents } from '../services/providerService';
import type { Incident, Provider } from '../lib/database.types';

export function useIncidents() {
  const [incidents, setIncidents] = useState<(Incident & { provider: Provider })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadIncidents() {
      try {
        const data = await fetchActiveIncidents();
        if (mounted) {
          setIncidents(data);
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

    loadIncidents();

    const channel = supabase
      .channel('incidents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
        },
        () => {
          loadIncidents();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, []);

  return { incidents, loading, error };
}
