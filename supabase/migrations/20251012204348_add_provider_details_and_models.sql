/*
  # Add Provider Details and AI Models System

  ## New Tables
    - `provider_details`
      - Platform-specific information (founding date, location, user count, etc.)
      - One-to-one relationship with providers
    
    - `ai_models`
      - AI models and sub-models for each provider
      - Multiple models per provider
      - Model metadata (release date, capabilities, pricing tier)

  ## Changes to Existing Tables
    - None (non-destructive)

  ## Security
    - Enable RLS on both tables
    - Public read access (information is public)
    - Admin-only write access

  ## Important Notes
    - All information is reference data for educational purposes
    - User counts and statistics are approximate/estimated
    - Data should be regularly updated for accuracy
*/

-- Provider Details Table
CREATE TABLE IF NOT EXISTS provider_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE UNIQUE NOT NULL,
  founded_date date,
  country text,
  headquarters text,
  average_users bigint,
  total_users bigint,
  company_type text,
  key_people jsonb DEFAULT '[]'::jsonb,
  funding_total text,
  description text,
  website_url text,
  api_documentation_url text,
  pricing_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Models Table
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  model_name text NOT NULL,
  model_version text,
  model_type text NOT NULL,
  release_date date,
  context_window integer,
  max_output_tokens integer,
  capabilities jsonb DEFAULT '[]'::jsonb,
  pricing_tier text,
  is_flagship boolean DEFAULT false,
  is_deprecated boolean DEFAULT false,
  parent_model_id uuid REFERENCES ai_models(id),
  parameters_count text,
  training_data_cutoff date,
  supports_vision boolean DEFAULT false,
  supports_function_calling boolean DEFAULT false,
  supports_streaming boolean DEFAULT true,
  api_endpoint text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE provider_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Public read access for provider details
CREATE POLICY "Anyone can view provider details"
  ON provider_details FOR SELECT
  TO public
  USING (true);

-- Public read access for AI models
CREATE POLICY "Anyone can view AI models"
  ON ai_models FOR SELECT
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_provider_details_provider_id ON provider_details(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_is_flagship ON ai_models(is_flagship) WHERE is_flagship = true;
CREATE INDEX IF NOT EXISTS idx_ai_models_model_type ON ai_models(model_type);

-- Insert OpenAI details as example
DO $$
DECLARE
  openai_id uuid;
BEGIN
  SELECT id INTO openai_id FROM providers WHERE slug = 'openai' LIMIT 1;
  
  IF openai_id IS NOT NULL THEN
    INSERT INTO provider_details (
      provider_id,
      founded_date,
      country,
      headquarters,
      average_users,
      total_users,
      company_type,
      key_people,
      funding_total,
      description,
      website_url,
      api_documentation_url,
      pricing_url
    ) VALUES (
      openai_id,
      '2015-12-11',
      'United States',
      'San Francisco, California',
      100000000,
      200000000,
      'Private (backed by Microsoft)',
      '[{"name": "Sam Altman", "role": "CEO"}, {"name": "Greg Brockman", "role": "President"}, {"name": "Ilya Sutskever", "role": "Chief Scientist"}]'::jsonb,
      '$11.3 billion',
      'OpenAI is an AI research and deployment company dedicated to ensuring that artificial general intelligence benefits all of humanity.',
      'https://openai.com',
      'https://platform.openai.com/docs',
      'https://openai.com/pricing'
    )
    ON CONFLICT (provider_id) DO NOTHING;

    INSERT INTO ai_models (
      provider_id,
      model_name,
      model_version,
      model_type,
      release_date,
      context_window,
      max_output_tokens,
      capabilities,
      pricing_tier,
      is_flagship,
      parameters_count,
      training_data_cutoff,
      supports_vision,
      supports_function_calling,
      supports_streaming,
      description
    ) VALUES 
    (
      openai_id,
      'GPT-4',
      'gpt-4-turbo',
      'Language Model',
      '2023-11-06',
      128000,
      4096,
      '["text generation", "conversation", "code generation", "analysis", "vision"]'::jsonb,
      'premium',
      true,
      '1.76 trillion',
      '2023-04-01',
      true,
      true,
      true,
      'Most capable GPT-4 model with vision capabilities and improved performance.'
    ),
    (
      openai_id,
      'GPT-4o',
      'gpt-4o',
      'Language Model',
      '2024-05-13',
      128000,
      4096,
      '["text generation", "conversation", "vision", "audio", "real-time"]'::jsonb,
      'premium',
      true,
      'undisclosed',
      '2023-10-01',
      true,
      true,
      true,
      'Flagship multimodal model with vision and audio capabilities, optimized for speed and cost.'
    ),
    (
      openai_id,
      'GPT-3.5',
      'gpt-3.5-turbo',
      'Language Model',
      '2022-11-30',
      16385,
      4096,
      '["text generation", "conversation", "code generation"]'::jsonb,
      'standard',
      false,
      '175 billion',
      '2021-09-01',
      false,
      true,
      true,
      'Fast and cost-effective model for most tasks.'
    ),
    (
      openai_id,
      'DALL-E 3',
      'dall-e-3',
      'Image Generation',
      '2023-10-01',
      NULL,
      NULL,
      '["image generation", "creative", "detailed prompts"]'::jsonb,
      'premium',
      true,
      'undisclosed',
      NULL,
      false,
      false,
      false,
      'Advanced image generation model with improved prompt understanding and detail.'
    ),
    (
      openai_id,
      'Whisper',
      'whisper-1',
      'Speech Recognition',
      '2022-09-21',
      NULL,
      NULL,
      '["speech-to-text", "translation", "multilingual"]'::jsonb,
      'standard',
      false,
      '1.55 billion',
      NULL,
      false,
      false,
      false,
      'Robust speech recognition model trained on 680,000 hours of multilingual data.'
    ),
    (
      openai_id,
      'Text Embedding',
      'text-embedding-3-large',
      'Embedding Model',
      '2024-01-25',
      8191,
      NULL,
      '["embeddings", "semantic search", "clustering"]'::jsonb,
      'standard',
      false,
      'undisclosed',
      NULL,
      false,
      false,
      false,
      'Most capable embedding model for semantic search and clustering tasks.'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
