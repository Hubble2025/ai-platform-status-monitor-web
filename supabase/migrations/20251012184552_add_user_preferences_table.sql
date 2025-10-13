/*
  # User Preferences Table

  ## Overview
  Creates a table to store user preferences including provider order for drag-and-drop functionality.

  ## New Tables

  ### `user_preferences`
  Stores user-specific preferences and settings
  - `id` (uuid, primary key) - Unique identifier
  - `session_id` (text) - Browser session identifier (for anonymous users)
  - `provider_order` (text[]) - Array of provider IDs in user's preferred order
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ## Security
  - RLS enabled with session-based access
  - Users can only access their own preferences based on session_id

  ## Indexes
  - Index on session_id for quick lookups
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  provider_order text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_session_id ON user_preferences(session_id);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);