-- Migration: Template Default Metadata Management
-- This migration adds template-level default metadata for videos

-- Create template defaults table
CREATE TABLE IF NOT EXISTS template_defaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_type VARCHAR(100) NOT NULL UNIQUE,
  default_consumer_title VARCHAR(255),
  default_consumer_description TEXT,
  default_parent_tip TEXT,
  default_display_image_url VARCHAR(500),
  default_display_image_source VARCHAR(50) DEFAULT 'custom',
  title_variables JSONB DEFAULT '{}', -- e.g., {"NAME": "child_name", "LETTER": "first_letter"}
  description_variables JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default templates
INSERT INTO template_defaults (template_type, default_consumer_title, default_consumer_description, default_parent_tip, title_variables, description_variables) VALUES
('letter-hunt', 'Letter Hunt Adventure', 'Help {NAME} find the letter {LETTER} throughout the day!', 'This video helps children recognize letters in their environment. Point out the letter {LETTER} when you see it in signs, books, or everyday objects to reinforce learning.', '{"NAME": "child_name", "LETTER": "first_letter"}', '{"NAME": "child_name", "LETTER": "first_letter"}'),
('name-video', 'Learn to Spell {NAME}', 'Watch {NAME} learn to spell their own name with fun animations and music!', 'Practice spelling {NAME} together after watching. Write it out, say each letter, and celebrate their progress!', '{"NAME": "child_name"}', '{"NAME": "child_name"}'),
('lullaby', 'Sweet Dreams, {NAME}', 'A gentle lullaby personalized for {NAME} to help them drift off to sleep.', 'Create a calming bedtime routine. Watch this video together, then read a book and sing a lullaby before lights out.', '{"NAME": "child_name"}', '{"NAME": "child_name"}');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_template_defaults_type ON template_defaults(template_type);

-- Enable RLS
ALTER TABLE template_defaults ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_defaults
-- Admins can manage all template defaults
CREATE POLICY "Admins can manage all template defaults" ON template_defaults
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

-- Add comments
COMMENT ON TABLE template_defaults IS 'Default metadata templates for different video types';
COMMENT ON COLUMN template_defaults.title_variables IS 'JSON object mapping variable names to data sources (e.g., child_name, first_letter)';
COMMENT ON COLUMN template_defaults.description_variables IS 'JSON object mapping variable names to data sources for descriptions'; 