export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      providers: {
        Row: {
          id: string
          name: string
          slug: string
          status_url: string | null
          api_endpoint: string | null
          icon_url: string | null
          is_active: boolean
          last_checked: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          status_url?: string | null
          api_endpoint?: string | null
          icon_url?: string | null
          is_active?: boolean
          last_checked?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          status_url?: string | null
          api_endpoint?: string | null
          icon_url?: string | null
          is_active?: boolean
          last_checked?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          provider_id: string
          component: string | null
          status: string
          severity: string | null
          title: string
          description: string | null
          regions: string[]
          started_at: string | null
          updated_at: string
          resolved_at: string | null
          fingerprint: string
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          component?: string | null
          status: string
          severity?: string | null
          title: string
          description?: string | null
          regions?: string[]
          started_at?: string | null
          updated_at?: string
          resolved_at?: string | null
          fingerprint: string
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          component?: string | null
          status?: string
          severity?: string | null
          title?: string
          description?: string | null
          regions?: string[]
          started_at?: string | null
          updated_at?: string
          resolved_at?: string | null
          fingerprint?: string
          raw_data?: Json | null
          created_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string | null
          email: string | null
          push_subscription: Json | null
          subscribed_providers: string[]
          alert_threshold: string
          regions: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email?: string | null
          push_subscription?: Json | null
          subscribed_providers?: string[]
          alert_threshold?: string
          regions?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string | null
          push_subscription?: Json | null
          subscribed_providers?: string[]
          alert_threshold?: string
          regions?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      status_checks: {
        Row: {
          id: string
          provider_id: string
          status: string
          response_time: number | null
          error_message: string | null
          checked_at: string
          raw_response: Json | null
        }
        Insert: {
          id?: string
          provider_id: string
          status: string
          response_time?: number | null
          error_message?: string | null
          checked_at?: string
          raw_response?: Json | null
        }
        Update: {
          id?: string
          provider_id?: string
          status?: string
          response_time?: number | null
          error_message?: string | null
          checked_at?: string
          raw_response?: Json | null
        }
      }
      changelog: {
        Row: {
          id: string
          version: string
          release_date: string
          type: string
          category: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          version: string
          release_date: string
          type: string
          category: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          version?: string
          release_date?: string
          type?: string
          category?: string
          description?: string
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          session_id: string
          provider_order: string[]
          favorite_providers: string[]
          theme: string
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          provider_order?: string[]
          favorite_providers?: string[]
          theme?: string
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          provider_order?: string[]
          favorite_providers?: string[]
          theme?: string
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      notification_rules: {
        Row: {
          id: string
          session_id: string
          name: string
          enabled: boolean
          provider_ids: string[]
          severity_threshold: string
          notify_channels: string[]
          quiet_hours_start: string | null
          quiet_hours_end: string | null
          muted_incidents: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          name: string
          enabled?: boolean
          provider_ids?: string[]
          severity_threshold?: string
          notify_channels?: string[]
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          muted_incidents?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          name?: string
          enabled?: boolean
          provider_ids?: string[]
          severity_threshold?: string
          notify_channels?: string[]
          quiet_hours_start?: string | null
          quiet_hours_end?: string | null
          muted_incidents?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      notification_history: {
        Row: {
          id: string
          session_id: string
          incident_id: string
          rule_id: string
          channel: string
          status: string
          sent_at: string
          read_at: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          session_id: string
          incident_id: string
          rule_id: string
          channel: string
          status?: string
          sent_at?: string
          read_at?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          session_id?: string
          incident_id?: string
          rule_id?: string
          channel?: string
          status?: string
          sent_at?: string
          read_at?: string | null
          metadata?: Json
        }
      }
      user_issue_reports: {
        Row: {
          id: string
          provider_id: string
          category: string
          severity: string
          title: string
          description: string
          affected_features: Json
          occurred_at: string
          contact_email: string | null
          ip_hash: string
          status: string
          upvotes: number
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          category: string
          severity: string
          title: string
          description: string
          affected_features?: Json
          occurred_at?: string
          contact_email?: string | null
          ip_hash: string
          status?: string
          upvotes?: number
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          category?: string
          severity?: string
          title?: string
          description?: string
          affected_features?: Json
          occurred_at?: string
          contact_email?: string | null
          ip_hash?: string
          status?: string
          upvotes?: number
          created_at?: string
          expires_at?: string
        }
      }
    }
  }
}

export type Provider = Database['public']['Tables']['providers']['Row']
export type Incident = Database['public']['Tables']['incidents']['Row']
export type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row']
export type StatusCheck = Database['public']['Tables']['status_checks']['Row']
export type Changelog = Database['public']['Tables']['changelog']['Row']
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
export type NotificationRule = Database['public']['Tables']['notification_rules']['Row']
export type NotificationHistory = Database['public']['Tables']['notification_history']['Row']

export interface ProviderDetails {
  id: string
  provider_id: string
  founded_date: string | null
  country: string | null
  headquarters: string | null
  average_users: number | null
  total_users: number | null
  company_type: string | null
  key_people: Json
  funding_total: string | null
  description: string | null
  website_url: string | null
  api_documentation_url: string | null
  pricing_url: string | null
  created_at: string
  updated_at: string
}

export interface AIModel {
  id: string
  provider_id: string
  model_name: string
  model_version: string | null
  model_type: string
  release_date: string | null
  context_window: number | null
  max_output_tokens: number | null
  capabilities: Json
  pricing_tier: string | null
  is_flagship: boolean
  is_deprecated: boolean
  parent_model_id: string | null
  parameters_count: string | null
  training_data_cutoff: string | null
  supports_vision: boolean
  supports_function_calling: boolean
  supports_streaming: boolean
  api_endpoint: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export type ProviderWithIncidents = Provider & {
  incidents?: Incident[]
  latest_check?: StatusCheck
}
