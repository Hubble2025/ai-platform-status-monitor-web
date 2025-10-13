import { supabase } from '../lib/supabase';

export interface FeedbackVote {
  id: string;
  provider_id: string;
  vote_type: 'working' | 'having_issues' | 'down';
  created_at: string;
}

export interface IssueReport {
  id: string;
  provider_id: string;
  category: 'performance' | 'outage' | 'api_issues' | 'feature_problems' | 'other';
  severity: 'minor' | 'major' | 'critical';
  title: string;
  description: string;
  affected_features?: string[];
  occurred_at: string;
  upvotes: number;
  created_at: string;
  status: 'open' | 'validated' | 'resolved' | 'spam';
}

export interface FeedbackStats {
  working_votes: number;
  issues_votes: number;
  down_votes: number;
  total_reports: number;
  critical_reports: number;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getIPHash(): string {
  const stored = localStorage.getItem('user_fingerprint');
  if (stored) return stored;

  const fingerprint = `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`;
  const hash = hashString(fingerprint);
  localStorage.setItem('user_fingerprint', hash);
  return hash;
}

export async function submitVote(
  providerId: string,
  voteType: 'working' | 'having_issues' | 'down'
): Promise<{ success: boolean; error?: string }> {
  try {
    const ipHash = getIPHash();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existingVote } = await supabase
      .from('user_feedback_votes')
      .select('id')
      .eq('provider_id', providerId)
      .eq('ip_hash', ipHash)
      .gte('created_at', oneHourAgo)
      .maybeSingle();

    if (existingVote) {
      return { success: false, error: 'You can only vote once per hour' };
    }

    const { error } = await supabase
      .from('user_feedback_votes')
      .insert({
        provider_id: providerId,
        vote_type: voteType,
        ip_hash: ipHash,
        user_agent_hash: hashString(navigator.userAgent)
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error submitting vote:', error);
    return { success: false, error: 'Failed to submit vote' };
  }
}

export async function submitIssueReport(
  providerId: string,
  data: {
    category: IssueReport['category'];
    severity: IssueReport['severity'];
    title: string;
    description: string;
    affected_features?: string[];
    occurred_at?: Date;
    contact_email?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const ipHash = getIPHash();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentReports, error: countError } = await supabase
      .from('user_issue_reports')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', oneHourAgo);

    if (countError) throw countError;

    if (recentReports && (recentReports as any).count >= 3) {
      return { success: false, error: 'Too many reports. Please wait before submitting again.' };
    }

    const { error } = await supabase
      .from('user_issue_reports')
      .insert({
        provider_id: providerId,
        category: data.category,
        severity: data.severity,
        title: data.title,
        description: data.description,
        affected_features: data.affected_features || [],
        occurred_at: data.occurred_at?.toISOString() || new Date().toISOString(),
        contact_email: data.contact_email,
        ip_hash: ipHash
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error submitting report:', error);
    return { success: false, error: 'Failed to submit report' };
  }
}

export async function upvoteReport(reportId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ipHash = getIPHash();

    const { error } = await supabase
      .from('report_upvotes')
      .insert({
        report_id: reportId,
        ip_hash: ipHash
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You have already upvoted this report' };
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error upvoting report:', error);
    return { success: false, error: 'Failed to upvote report' };
  }
}

export async function getFeedbackStats(providerId: string): Promise<FeedbackStats> {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: votes } = await supabase
      .from('user_feedback_votes')
      .select('vote_type')
      .eq('provider_id', providerId)
      .gte('created_at', twoHoursAgo);

    const { data: reports } = await supabase
      .from('user_issue_reports')
      .select('severity, status')
      .eq('provider_id', providerId)
      .in('status', ['open', 'validated'])
      .gte('created_at', twoHoursAgo);

    const stats: FeedbackStats = {
      working_votes: votes?.filter(v => v.vote_type === 'working').length || 0,
      issues_votes: votes?.filter(v => v.vote_type === 'having_issues').length || 0,
      down_votes: votes?.filter(v => v.vote_type === 'down').length || 0,
      total_reports: reports?.length || 0,
      critical_reports: reports?.filter(r => r.severity === 'critical').length || 0
    };

    return stats;
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return {
      working_votes: 0,
      issues_votes: 0,
      down_votes: 0,
      total_reports: 0,
      critical_reports: 0
    };
  }
}

export async function getIssueReports(providerId: string): Promise<IssueReport[]> {
  try {
    const { data, error } = await supabase
      .from('user_issue_reports')
      .select('*')
      .eq('provider_id', providerId)
      .in('status', ['open', 'validated'])
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching issue reports:', error);
    return [];
  }
}
