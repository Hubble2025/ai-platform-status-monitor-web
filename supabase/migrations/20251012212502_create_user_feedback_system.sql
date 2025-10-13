/*
  # User Feedback System

  ## Overview
  Implements a comprehensive user feedback system allowing users to report issues and vote on provider status.

  ## New Tables

  ### 1. `user_feedback_votes`
  Quick voting system for provider status validation
  - `id` (uuid, primary key)
  - `provider_id` (uuid, foreign key to providers)
  - `vote_type` (text: 'working', 'having_issues', 'down')
  - `ip_hash` (text, hashed IP for rate limiting)
  - `user_agent_hash` (text, hashed user agent for fingerprinting)
  - `created_at` (timestamp)

  ### 2. `user_issue_reports`
  Detailed issue reporting system
  - `id` (uuid, primary key)
  - `provider_id` (uuid, foreign key to providers)
  - `category` (text: 'performance', 'outage', 'api_issues', 'feature_problems', 'other')
  - `severity` (text: 'minor', 'major', 'critical')
  - `title` (text, brief description)
  - `description` (text, detailed description)
  - `affected_features` (jsonb array, optional)
  - `occurred_at` (timestamp, when issue was noticed)
  - `contact_email` (text, optional)
  - `ip_hash` (text, for rate limiting)
  - `status` (text: 'open', 'validated', 'resolved', 'spam')
  - `upvotes` (integer, default 0)
  - `created_at` (timestamp)
  - `expires_at` (timestamp, auto-set to 24h after creation)

  ### 3. `feedback_aggregations`
  Hourly aggregated statistics for performance
  - `id` (uuid, primary key)
  - `provider_id` (uuid, foreign key)
  - `hour_bucket` (timestamp, rounded to hour)
  - `working_votes` (integer)
  - `issues_votes` (integer)
  - `down_votes` (integer)
  - `total_reports` (integer)
  - `critical_reports` (integer)
  - `created_at` (timestamp)

  ### 4. `report_upvotes`
  Track user upvotes on reports
  - `id` (uuid, primary key)
  - `report_id` (uuid, foreign key to user_issue_reports)
  - `ip_hash` (text)
  - `created_at` (timestamp)
  - Unique constraint on (report_id, ip_hash)

  ## Security
  - Enable RLS on all tables
  - Public read access for viewing feedback
  - Authenticated and anonymous users can submit feedback
  - Rate limiting implemented via IP hash checks
  - Spam protection through unique constraints

  ## Indexes
  - Index on provider_id for fast lookups
  - Index on created_at for time-based queries
  - Index on ip_hash for rate limiting checks
  - Index on expires_at for cleanup queries
*/

-- User Feedback Votes Table
CREATE TABLE IF NOT EXISTS user_feedback_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('working', 'having_issues', 'down')),
  ip_hash text NOT NULL,
  user_agent_hash text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_vote_type CHECK (vote_type IN ('working', 'having_issues', 'down'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_votes_provider ON user_feedback_votes(provider_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_created ON user_feedback_votes(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_ip ON user_feedback_votes(ip_hash);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_recent ON user_feedback_votes(provider_id, created_at DESC);

-- User Issue Reports Table
CREATE TABLE IF NOT EXISTS user_issue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('performance', 'outage', 'api_issues', 'feature_problems', 'other')),
  severity text NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  title text NOT NULL,
  description text NOT NULL,
  affected_features jsonb DEFAULT '[]'::jsonb,
  occurred_at timestamptz DEFAULT now(),
  contact_email text,
  ip_hash text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'validated', 'resolved', 'spam')),
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_issue_reports_provider ON user_issue_reports(provider_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_created ON user_issue_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON user_issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_issue_reports_expires ON user_issue_reports(expires_at);
CREATE INDEX IF NOT EXISTS idx_issue_reports_severity ON user_issue_reports(severity);

-- Report Upvotes Table
CREATE TABLE IF NOT EXISTS report_upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES user_issue_reports(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(report_id, ip_hash)
);

CREATE INDEX IF NOT EXISTS idx_report_upvotes_report ON report_upvotes(report_id);

-- Feedback Aggregations Table
CREATE TABLE IF NOT EXISTS feedback_aggregations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  hour_bucket timestamptz NOT NULL,
  working_votes integer DEFAULT 0,
  issues_votes integer DEFAULT 0,
  down_votes integer DEFAULT 0,
  total_reports integer DEFAULT 0,
  critical_reports integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_aggregations_provider ON feedback_aggregations(provider_id);
CREATE INDEX IF NOT EXISTS idx_aggregations_hour ON feedback_aggregations(hour_bucket);

-- Enable RLS
ALTER TABLE user_feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_aggregations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_feedback_votes
CREATE POLICY "Anyone can view votes"
  ON user_feedback_votes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can submit votes"
  ON user_feedback_votes FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for user_issue_reports
CREATE POLICY "Anyone can view open/validated reports"
  ON user_issue_reports FOR SELECT
  TO public
  USING (status IN ('open', 'validated', 'resolved'));

CREATE POLICY "Anyone can submit reports"
  ON user_issue_reports FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for report_upvotes
CREATE POLICY "Anyone can view upvotes"
  ON report_upvotes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can submit upvotes"
  ON report_upvotes FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for feedback_aggregations
CREATE POLICY "Anyone can view aggregations"
  ON feedback_aggregations FOR SELECT
  TO public
  USING (true);

-- Function to update report upvote count
CREATE OR REPLACE FUNCTION update_report_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_issue_reports
  SET upvotes = (
    SELECT COUNT(*) FROM report_upvotes WHERE report_id = NEW.report_id
  )
  WHERE id = NEW.report_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_report_upvotes ON report_upvotes;
CREATE TRIGGER trigger_update_report_upvotes
  AFTER INSERT ON report_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION update_report_upvotes();

-- Function to aggregate feedback hourly
CREATE OR REPLACE FUNCTION aggregate_feedback_hourly()
RETURNS void AS $$
BEGIN
  INSERT INTO feedback_aggregations (
    provider_id,
    hour_bucket,
    working_votes,
    issues_votes,
    down_votes,
    total_reports,
    critical_reports
  )
  SELECT 
    provider_id,
    date_trunc('hour', created_at) as hour_bucket,
    COUNT(*) FILTER (WHERE vote_type = 'working') as working_votes,
    COUNT(*) FILTER (WHERE vote_type = 'having_issues') as issues_votes,
    COUNT(*) FILTER (WHERE vote_type = 'down') as down_votes,
    0 as total_reports,
    0 as critical_reports
  FROM user_feedback_votes
  WHERE created_at >= now() - interval '1 hour'
  GROUP BY provider_id, hour_bucket
  ON CONFLICT (provider_id, hour_bucket) 
  DO UPDATE SET
    working_votes = EXCLUDED.working_votes,
    issues_votes = EXCLUDED.issues_votes,
    down_votes = EXCLUDED.down_votes;

  UPDATE feedback_aggregations fa
  SET 
    total_reports = (
      SELECT COUNT(*) 
      FROM user_issue_reports 
      WHERE provider_id = fa.provider_id 
        AND date_trunc('hour', created_at) = fa.hour_bucket
        AND status != 'spam'
    ),
    critical_reports = (
      SELECT COUNT(*) 
      FROM user_issue_reports 
      WHERE provider_id = fa.provider_id 
        AND date_trunc('hour', created_at) = fa.hour_bucket
        AND severity = 'critical'
        AND status != 'spam'
    )
  WHERE hour_bucket >= now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired reports
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS void AS $$
BEGIN
  UPDATE user_issue_reports
  SET status = 'resolved'
  WHERE expires_at < now() 
    AND status = 'open';
END;
$$ LANGUAGE plpgsql;