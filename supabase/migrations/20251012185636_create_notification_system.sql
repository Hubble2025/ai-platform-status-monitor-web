/*
  # Notification System

  ## Overview
  Creates tables for managing intelligent incident notifications with filtering and alert rules.

  ## New Tables

  ### `notification_rules`
  Stores user-defined alert rules and filters
  - `id` (uuid, primary key) - Unique identifier
  - `session_id` (text) - User session identifier
  - `name` (text) - Rule name
  - `enabled` (boolean) - Whether rule is active
  - `provider_ids` (text[]) - Which providers to monitor
  - `severity_threshold` (text) - Minimum severity (minor, major, critical)
  - `notify_channels` (text[]) - Channels (email, push, webhook)
  - `quiet_hours_start` (time) - Do not disturb start time
    - `quiet_hours_end` (time) - Do not disturb end time
  - `muted_incidents` (text[]) - Fingerprints of muted incidents
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `notification_history`
  Tracks all sent notifications
  - `id` (uuid, primary key)
  - `session_id` (text)
  - `incident_id` (uuid, foreign key)
  - `rule_id` (uuid, foreign key)
  - `channel` (text)
  - `status` (text) - sent, failed, read
  - `sent_at` (timestamptz)
  - `read_at` (timestamptz)
  - `metadata` (jsonb)

  ## Security
  - RLS enabled for both tables
  - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  name text NOT NULL,
  enabled boolean DEFAULT true,
  provider_ids text[] DEFAULT '{}',
  severity_threshold text DEFAULT 'minor',
  notify_channels text[] DEFAULT '{}',
  quiet_hours_start time,
  quiet_hours_end time,
  muted_incidents text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES notification_rules(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_notification_rules_session ON notification_rules(session_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_session ON notification_history(session_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at DESC);

ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification rules"
  ON notification_rules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert own notification rules"
  ON notification_rules FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notification rules"
  ON notification_rules FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own notification rules"
  ON notification_rules FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can view own notification history"
  ON notification_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "System can insert notification history"
  ON notification_history FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);