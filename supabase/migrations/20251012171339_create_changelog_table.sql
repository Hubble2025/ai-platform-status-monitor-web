/*
  # Changelog System

  ## Overview
  Creates a changelog table to track all updates, additions, and fixes to the application.

  ## New Tables

  ### `changelog`
  Stores all changelog entries with version tracking
  - `id` (uuid, primary key) - Unique identifier
  - `version` (text) - Version number (e.g., "1.0.0", "1.1.0")
  - `release_date` (date) - Date of the release
  - `type` (text) - Type of change (added, changed, fixed, removed)
  - `category` (text) - Category (feature, provider, ui, backend, etc.)
  - `description` (text) - Description of the change
  - `created_at` (timestamptz) - Record creation time

  ## Security
  - RLS enabled with public read access
  - Only service role can write

  ## Initial Data
  Pre-populated with current application state
*/

CREATE TABLE IF NOT EXISTS changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  release_date date NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_changelog_release_date ON changelog(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_changelog_version ON changelog(version);

ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view changelog"
  ON changelog FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert changelog"
  ON changelog FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update changelog"
  ON changelog FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

INSERT INTO changelog (version, release_date, type, category, description) VALUES
  ('1.0.0', '2025-10-12', 'added', 'feature', 'Initial release with real-time AI platform status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'providers', 'OpenAI status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'providers', 'Anthropic status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'providers', 'Google AI status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'providers', 'Meta AI status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'providers', 'Mistral AI status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'providers', 'Cohere status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'providers', 'HuggingFace status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'providers', 'Stability AI status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'providers', 'Replicate status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'providers', 'Perplexity status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'providers', 'ElevenLabs status monitoring'),
  ('1.0.0', '2025-10-12', 'added', 'feature', 'Dashboard with provider status grid and incident overview'),
  ('1.0.0', '2025-10-12', 'added', 'feature', 'Provider detail pages with incident timeline'),
  ('1.0.0', '2025-10-12', 'added', 'feature', 'Settings panel for notification preferences and provider selection'),
  ('1.0.0', '2025-10-12', 'added', 'feature', 'Web Push notification support'),
  ('1.0.0', '2025-10-12', 'added', 'backend', 'Supabase Edge Function for automated status polling'),
  ('1.1.0', '2025-10-12', 'added', 'providers', 'Grok (X.AI) status monitoring'),
  ('1.1.0', '2025-10-12', 'added', 'providers', 'Manus status monitoring'),
  ('1.1.0', '2025-10-12', 'added', 'providers', 'DeepSeek status monitoring'),
  ('1.1.0', '2025-10-12', 'added', 'feature', 'Changelog system with version tracking'),
  ('1.1.0', '2025-10-12', 'changed', 'backend', 'Updated status polling interval to 15 minutes'),
  ('1.1.0', '2025-10-12', 'added', 'ui', 'Hamburger menu with changelog access');