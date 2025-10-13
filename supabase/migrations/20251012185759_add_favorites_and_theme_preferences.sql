/*
  # User Preferences Extensions

  ## Overview
  Extends user_preferences table with favorites and theme settings.

  ## Changes
  - Add favorite_providers column
  - Add theme column
  - Add language column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'favorite_providers'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN favorite_providers text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'theme'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN theme text DEFAULT 'dark';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'language'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN language text DEFAULT 'en';
  END IF;
END $$;