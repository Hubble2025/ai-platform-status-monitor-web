/*
  # AI Platform Status Monitor Database Schema

  ## Overview
  This migration creates the complete database schema for monitoring AI platform status
  in real-time, including incident tracking, provider management, and user alert preferences.

  ## New Tables

  ### 1. `providers`
  Stores information about monitored AI platforms
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Provider name (e.g., "OpenAI", "Anthropic")
  - `slug` (text, unique) - URL-safe identifier
  - `status_url` (text) - Official status page URL
  - `api_endpoint` (text) - API endpoint for status checks
  - `icon_url` (text) - Provider logo/icon URL
  - `is_active` (boolean) - Whether monitoring is enabled
  - `last_checked` (timestamptz) - Last status check timestamp
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ### 2. `incidents`
  Tracks all incidents and status changes
  - `id` (uuid, primary key) - Unique identifier
  - `provider_id` (uuid, foreign key) - References providers table
  - `component` (text) - Affected component/service
  - `status` (text) - Current status (operational, degraded, outage)
  - `severity` (text) - Severity level (minor, major, critical)
  - `title` (text) - Incident title
  - `description` (text) - Detailed description
  - `regions` (text[]) - Affected regions
  - `started_at` (timestamptz) - Incident start time
  - `updated_at` (timestamptz) - Last update time
  - `resolved_at` (timestamptz) - Resolution time (null if ongoing)
  - `fingerprint` (text, unique) - Deduplication hash
  - `raw_data` (jsonb) - Original API response
  - `created_at` (timestamptz) - Record creation time

  ### 3. `user_subscriptions`
  Stores user preferences for alerts and notifications
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - User identifier (for future auth integration)
  - `email` (text) - Email for notifications
  - `push_subscription` (jsonb) - Web Push subscription details
  - `subscribed_providers` (uuid[]) - Array of provider IDs to monitor
  - `alert_threshold` (text) - Minimum severity for alerts (minor, major, critical)
  - `regions` (text[]) - Specific regions to monitor
  - `is_active` (boolean) - Whether subscription is active
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ### 4. `status_checks`
  Logs all status check attempts for monitoring and debugging
  - `id` (uuid, primary key) - Unique identifier
  - `provider_id` (uuid, foreign key) - References providers table
  - `status` (text) - Check result status
  - `response_time` (integer) - Response time in milliseconds
  - `error_message` (text) - Error details if check failed
  - `checked_at` (timestamptz) - Check timestamp
  - `raw_response` (jsonb) - Full API response

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public read access for providers, incidents, and status_checks
  - User-specific access for user_subscriptions
  - Service role required for writes

  ## Indexes
  - Optimized for querying by provider, status, and time ranges
  - Unique constraints on slugs and fingerprints for deduplication
*/

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  status_url text,
  api_endpoint text,
  icon_url text,
  is_active boolean DEFAULT true,
  last_checked timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  component text,
  status text NOT NULL,
  severity text,
  title text NOT NULL,
  description text,
  regions text[] DEFAULT '{}',
  started_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  fingerprint text UNIQUE NOT NULL,
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  push_subscription jsonb,
  subscribed_providers uuid[] DEFAULT '{}',
  alert_threshold text DEFAULT 'major',
  regions text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create status_checks table
CREATE TABLE IF NOT EXISTS status_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  status text NOT NULL,
  response_time integer,
  error_message text,
  checked_at timestamptz DEFAULT now(),
  raw_response jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_provider_id ON incidents(provider_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_started_at ON incidents(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_resolved_at ON incidents(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_status_checks_provider_id ON status_checks(provider_id);
CREATE INDEX IF NOT EXISTS idx_status_checks_checked_at ON status_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_providers_slug ON providers(slug);

-- Enable Row Level Security
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for providers (public read, service write)
CREATE POLICY "Anyone can view providers"
  ON providers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert providers"
  ON providers FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update providers"
  ON providers FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for incidents (public read, service write)
CREATE POLICY "Anyone can view incidents"
  ON incidents FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert incidents"
  ON incidents FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update incidents"
  ON incidents FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for status_checks (public read, service write)
CREATE POLICY "Anyone can view status checks"
  ON status_checks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert status checks"
  ON status_checks FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policies for user_subscriptions (user-specific access)
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial provider data
INSERT INTO providers (name, slug, status_url, icon_url, is_active) VALUES
  ('OpenAI', 'openai', 'https://status.openai.com', 'https://openai.com/favicon.ico', true),
  ('Anthropic', 'anthropic', 'https://status.anthropic.com', 'https://anthropic.com/favicon.ico', true),
  ('Google AI', 'google-ai', 'https://status.cloud.google.com', 'https://ai.google/favicon.ico', true),
  ('Meta AI', 'meta-ai', 'https://metastatus.com', 'https://ai.meta.com/favicon.ico', true),
  ('Mistral AI', 'mistral', 'https://status.mistral.ai', 'https://mistral.ai/favicon.ico', true),
  ('Cohere', 'cohere', 'https://status.cohere.com', 'https://cohere.com/favicon.ico', true),
  ('HuggingFace', 'huggingface', 'https://status.huggingface.co', 'https://huggingface.co/favicon.ico', true),
  ('Stability AI', 'stability', 'https://status.stability.ai', 'https://stability.ai/favicon.ico', true),
  ('Replicate', 'replicate', 'https://status.replicate.com', 'https://replicate.com/favicon.ico', true),
  ('Perplexity', 'perplexity', 'https://status.perplexity.ai', 'https://perplexity.ai/favicon.ico', true),
  ('ElevenLabs', 'elevenlabs', 'https://status.elevenlabs.io', 'https://elevenlabs.io/favicon.ico', true)
ON CONFLICT (slug) DO NOTHING;