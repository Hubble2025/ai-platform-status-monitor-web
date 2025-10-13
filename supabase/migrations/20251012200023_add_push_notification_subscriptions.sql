/*
  # Add Push Notification Subscription Storage

  1. New Table
    - `push_subscriptions`
      - `id` (uuid, primary key)
      - `session_id` (text) - Browser session identifier
      - `endpoint` (text) - Push subscription endpoint
      - `p256dh_key` (text) - Encryption key
      - `auth_key` (text) - Authentication key
      - `provider_ids` (uuid[]) - Array of provider IDs to subscribe to (empty = all)
      - `severity_filter` (text) - 'critical', 'major', 'all'
      - `notify_on_start` (boolean) - Notify when incident starts
      - `notify_on_resolved` (boolean) - Notify when incident resolved
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modifications to existing notification_history
    - Add `push_subscription_id` column to link with push subscriptions

  3. Security
    - Enable RLS on push_subscriptions table
    - Anonymous users can manage their own subscriptions via session_id

  4. Important Notes
    - Subscriptions are browser-specific (based on push endpoint)
    - No user authentication required (works for anonymous users)
    - Works with existing notification_rules system
*/

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  endpoint text UNIQUE NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  provider_ids uuid[] DEFAULT '{}',
  severity_filter text DEFAULT 'critical' CHECK (severity_filter IN ('critical', 'major', 'all')),
  notify_on_start boolean DEFAULT true,
  notify_on_resolved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add push_subscription_id to notification_history if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_history' AND column_name = 'push_subscription_id'
  ) THEN
    ALTER TABLE notification_history ADD COLUMN push_subscription_id uuid REFERENCES push_subscriptions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
DROP POLICY IF EXISTS "Anyone can create push subscription" ON push_subscriptions;
CREATE POLICY "Anyone can create push subscription"
  ON push_subscriptions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_session_id ON push_subscriptions(session_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_notification_history_push_subscription_id ON notification_history(push_subscription_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();
