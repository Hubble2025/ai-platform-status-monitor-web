import { supabase } from '../lib/supabase';

export interface PlatformRegistry {
  id: string;
  name: string;
  website_url?: string;
  status_page_url?: string;
  status_api_url: string;
  api_type: 'statuspage.io' | 'atlassian' | 'custom' | 'rss' | 'uptime-robot';
  api_config: Record<string, any>;
  discovered_at: string;
  verified_at?: string;
  verification_status: 'pending' | 'verified' | 'failed' | 'inactive';
  auto_discovered: boolean;
  reliability_score: number;
  check_count: number;
  success_count: number;
  last_check_at?: string;
  is_active: boolean;
  category?: string;
  suggested_by_user_id?: string;
  votes_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PlatformSuggestion {
  id: string;
  user_id?: string;
  platform_name: string;
  status_url: string;
  reason?: string;
  upvotes: number;
  status: 'pending' | 'approved' | 'rejected' | 'added';
  registry_id?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface PlatformVote {
  user_id: string;
  suggestion_id: string;
  created_at: string;
}

export interface DiscoveryLog {
  id: string;
  source: string;
  platform_name?: string;
  status_url?: string;
  success: boolean;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export class PlatformDiscoveryService {
  async getPlatformRegistry(filters?: {
    active?: boolean;
    verified?: boolean;
    limit?: number;
  }): Promise<PlatformRegistry[]> {
    let query = supabase.from('platform_registry').select('*');

    if (filters?.active !== undefined) {
      query = query.eq('is_active', filters.active);
    }

    if (filters?.verified) {
      query = query.eq('verification_status', 'verified');
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('reliability_score', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getSuggestions(filters?: {
    status?: string;
    limit?: number;
  }): Promise<PlatformSuggestion[]> {
    let query = supabase.from('platform_suggestions').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('upvotes', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async submitSuggestion(suggestion: {
    platform_name: string;
    status_url: string;
    reason?: string;
  }): Promise<PlatformSuggestion> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('platform_suggestions')
      .insert({
        user_id: user?.id,
        platform_name: suggestion.platform_name,
        status_url: suggestion.status_url,
        reason: suggestion.reason,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async voteSuggestion(suggestionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Must be logged in to vote');
    }

    const { error } = await supabase
      .from('platform_votes')
      .insert({
        user_id: user.id,
        suggestion_id: suggestionId,
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Already voted for this suggestion');
      }
      throw error;
    }
  }

  async unvoteSuggestion(suggestionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Must be logged in to unvote');
    }

    const { error } = await supabase
      .from('platform_votes')
      .delete()
      .eq('user_id', user.id)
      .eq('suggestion_id', suggestionId);

    if (error) throw error;
  }

  async hasVoted(suggestionId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from('platform_votes')
      .select('suggestion_id')
      .eq('user_id', user.id)
      .eq('suggestion_id', suggestionId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  async verifyPlatform(platformName: string, statusUrl: string): Promise<any> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discover-platforms`;

    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'verify',
        platformName,
        platformUrl: statusUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Verification failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getDiscoveryLogs(limit: number = 50): Promise<DiscoveryLog[]> {
    const { data, error } = await supabase
      .from('discovery_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async updatePlatformStatus(
    platformId: string,
    updates: Partial<PlatformRegistry>
  ): Promise<void> {
    const { error } = await supabase
      .from('platform_registry')
      .update(updates)
      .eq('id', platformId);

    if (error) throw error;
  }

  async activatePlatform(platformId: string): Promise<void> {
    await this.updatePlatformStatus(platformId, {
      is_active: true,
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
    });
  }

  async deactivatePlatform(platformId: string): Promise<void> {
    await this.updatePlatformStatus(platformId, {
      is_active: false,
      verification_status: 'inactive',
    });
  }

  subscribeToRegistry(callback: (registry: PlatformRegistry[]) => void) {
    return supabase
      .channel('platform_registry_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platform_registry',
        },
        async () => {
          const platforms = await this.getPlatformRegistry();
          callback(platforms);
        }
      )
      .subscribe();
  }

  subscribeToSuggestions(callback: (suggestions: PlatformSuggestion[]) => void) {
    return supabase
      .channel('platform_suggestions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platform_suggestions',
        },
        async () => {
          const suggestions = await this.getSuggestions();
          callback(suggestions);
        }
      )
      .subscribe();
  }
}

export const platformDiscoveryService = new PlatformDiscoveryService();
