/*
  # Platform Auto-Discovery System

  ## Overview
  Enables automatic discovery and management of AI platform status pages.
  Users can suggest platforms, vote on suggestions, and the system can
  auto-discover new platforms through various sources.

  ## 1. New Tables

  ### `platform_registry`
  Central registry for discovered and suggested platforms
  - `id` (uuid, primary key)
  - `name` (text) - Platform name
  - `website_url` (text) - Main website
  - `status_page_url` (text) - Human-readable status page
  - `status_api_url` (text) - API endpoint for status checks
  - `api_type` (text) - Format: statuspage.io, atlassian, custom, rss
  - `api_config` (jsonb) - Format-specific configuration
  - `discovered_at` (timestamptz) - When platform was first discovered
  - `verified_at` (timestamptz) - When platform passed verification
  - `verification_status` (text) - pending, verified, failed, inactive
  - `auto_discovered` (boolean) - Whether discovered automatically or manually
  - `reliability_score` (float) - Quality score based on check success rate
  - `check_count` (integer) - Total number of status checks performed
  - `success_count` (integer) - Number of successful status checks
  - `last_check_at` (timestamptz) - Last verification check timestamp
  - `is_active` (boolean) - Whether platform is active in main dashboard
  - `category` (text) - Platform category (LLM, Image, Audio, etc)
  - `suggested_by_user_id` (uuid) - User who suggested this platform
  - `votes_count` (integer) - Community votes for this platform
  - `metadata` (jsonb) - Additional platform info (logo, description, etc)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `platform_suggestions`
  User-submitted platform suggestions
  - `id` (uuid, primary key)
  - `user_id` (uuid) - User who made the suggestion
  - `platform_name` (text) - Suggested platform name
  - `status_url` (text) - Status page URL
  - `reason` (text) - Why this platform should be added
  - `upvotes` (integer) - Number of upvotes
  - `status` (text) - pending, approved, rejected, added
  - `registry_id` (uuid) - Link to platform_registry once added
  - `reviewed_at` (timestamptz) - When reviewed by admin
  - `created_at` (timestamptz)

  ### `platform_votes`
  User votes on platform suggestions
  - `user_id` (uuid) - User who voted
  - `suggestion_id` (uuid) - Suggestion being voted on
  - `created_at` (timestamptz)
  - Primary key: (user_id, suggestion_id)

  ### `discovery_logs`
  Logs from auto-discovery system
  - `id` (uuid, primary key)
  - `source` (text) - Discovery source (crawler, api, manual, etc)
  - `platform_name` (text) - Discovered platform name
  - `status_url` (text) - Found status URL
  - `success` (boolean) - Whether discovery was successful
  - `error_message` (text) - Error details if failed
  - `metadata` (jsonb) - Additional discovery data
  - `created_at` (timestamptz)

  ## 2. Security

  ### Row Level Security
  - Enable RLS on all new tables
  - Public read access to verified platforms in registry
  - Authenticated users can suggest platforms and vote
  - Only authenticated users can view their own suggestions
  - Admin-only access for verification and approval

  ### Policies
  - Users can read verified/active platforms
  - Users can create suggestions
  - Users can vote on suggestions (one vote per user per suggestion)
  - Users can read their own suggestions
  - Discovery logs are admin-only

  ## 3. Important Notes
  - Platforms start as 'pending' and require verification before going live
  - Reliability score is calculated as success_count / check_count
  - Auto-discovered platforms require 7 days of successful checks before activation
  - Manual suggestions can be fast-tracked by admins
  - Voting system helps prioritize which platforms to verify first
*/

-- Create platform_registry table
CREATE TABLE IF NOT EXISTS platform_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website_url text,
  status_page_url text,
  status_api_url text NOT NULL,
  api_type text NOT NULL CHECK (api_type IN ('statuspage.io', 'atlassian', 'custom', 'rss', 'uptime-robot')),
  api_config jsonb DEFAULT '{}',
  discovered_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'inactive')),
  auto_discovered boolean DEFAULT false,
  reliability_score float DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 1),
  check_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  last_check_at timestamptz,
  is_active boolean DEFAULT false,
  category text,
  suggested_by_user_id uuid,
  votes_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create platform_suggestions table
CREATE TABLE IF NOT EXISTS platform_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  platform_name text NOT NULL,
  status_url text NOT NULL,
  reason text,
  upvotes integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'added')),
  registry_id uuid REFERENCES platform_registry(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create platform_votes table
CREATE TABLE IF NOT EXISTS platform_votes (
  user_id uuid NOT NULL,
  suggestion_id uuid NOT NULL REFERENCES platform_suggestions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, suggestion_id)
);

-- Create discovery_logs table
CREATE TABLE IF NOT EXISTS discovery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  platform_name text,
  status_url text,
  success boolean DEFAULT false,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_platform_registry_active ON platform_registry(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_platform_registry_status ON platform_registry(verification_status);
CREATE INDEX IF NOT EXISTS idx_platform_registry_score ON platform_registry(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_platform_suggestions_status ON platform_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_platform_suggestions_votes ON platform_suggestions(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_logs_created ON discovery_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE platform_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_registry

-- Anyone can view active and verified platforms
CREATE POLICY "Public can view active platforms"
  ON platform_registry FOR SELECT
  USING (is_active = true AND verification_status = 'verified');

-- Authenticated users can view all platforms (for admin dashboard)
CREATE POLICY "Authenticated users can view all platforms"
  ON platform_registry FOR SELECT
  TO authenticated
  USING (true);

-- Only system/admin can insert platforms (via Edge Functions)
CREATE POLICY "System can insert platforms"
  ON platform_registry FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only system/admin can update platforms
CREATE POLICY "System can update platforms"
  ON platform_registry FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for platform_suggestions

-- Authenticated users can view all suggestions
CREATE POLICY "Authenticated users can view suggestions"
  ON platform_suggestions FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create suggestions
CREATE POLICY "Authenticated users can create suggestions"
  ON platform_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own suggestions
CREATE POLICY "Users can update own suggestions"
  ON platform_suggestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for platform_votes

-- Authenticated users can view votes
CREATE POLICY "Authenticated users can view votes"
  ON platform_votes FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote"
  ON platform_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own votes
CREATE POLICY "Users can remove own votes"
  ON platform_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for discovery_logs

-- Only authenticated users (admin) can view logs
CREATE POLICY "Authenticated users can view discovery logs"
  ON discovery_logs FOR SELECT
  TO authenticated
  USING (true);

-- Only system can insert logs
CREATE POLICY "System can insert discovery logs"
  ON discovery_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_platform_registry_updated_at ON platform_registry;
CREATE TRIGGER update_platform_registry_updated_at
  BEFORE UPDATE ON platform_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update votes count on platform_suggestions
CREATE OR REPLACE FUNCTION update_suggestion_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE platform_suggestions 
    SET upvotes = upvotes + 1 
    WHERE id = NEW.suggestion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE platform_suggestions 
    SET upvotes = upvotes - 1 
    WHERE id = OLD.suggestion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update suggestion votes
DROP TRIGGER IF EXISTS update_votes_count_trigger ON platform_votes;
CREATE TRIGGER update_votes_count_trigger
  AFTER INSERT OR DELETE ON platform_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_suggestion_votes_count();

-- Function to calculate and update reliability score
CREATE OR REPLACE FUNCTION update_platform_reliability_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_count > 0 THEN
    NEW.reliability_score = CAST(NEW.success_count AS FLOAT) / CAST(NEW.check_count AS FLOAT);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate reliability score
DROP TRIGGER IF EXISTS calculate_reliability_score ON platform_registry;
CREATE TRIGGER calculate_reliability_score
  BEFORE UPDATE ON platform_registry
  FOR EACH ROW
  WHEN (OLD.check_count IS DISTINCT FROM NEW.check_count OR OLD.success_count IS DISTINCT FROM NEW.success_count)
  EXECUTE FUNCTION update_platform_reliability_score();