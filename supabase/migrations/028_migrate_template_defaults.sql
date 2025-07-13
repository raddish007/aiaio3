-- Migration to update existing template defaults to new schema
-- This migration updates the existing template defaults to use the new structure

-- First, let's see what we have
SELECT * FROM template_defaults;

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'template_defaults' AND column_name = 'default_title') THEN
    ALTER TABLE template_defaults ADD COLUMN default_title TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'template_defaults' AND column_name = 'default_description') THEN
    ALTER TABLE template_defaults ADD COLUMN default_description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'template_defaults' AND column_name = 'personalization_level') THEN
    ALTER TABLE template_defaults ADD COLUMN personalization_level TEXT DEFAULT 'generic';
  END IF;
END $$;

-- Update existing template defaults to use new structure
UPDATE template_defaults 
SET 
  default_title = COALESCE(default_consumer_title, ''),
  default_description = COALESCE(default_consumer_description, ''),
  personalization_level = 'generic'
WHERE default_consumer_title IS NOT NULL;

-- Update variable placeholders from old format to new format
UPDATE template_defaults 
SET 
  default_title = REPLACE(default_title, '{NAME}', '{NAME}'),
  default_description = REPLACE(default_description, '{NAME}', '{NAME}'),
  default_parent_tip = REPLACE(default_parent_tip, '{NAME}', '{NAME}')
WHERE default_title LIKE '%{NAME}%' OR default_description LIKE '%{NAME}%' OR default_parent_tip LIKE '%{NAME}%';

-- Make new columns NOT NULL after data migration
ALTER TABLE template_defaults ALTER COLUMN default_title SET NOT NULL;
ALTER TABLE template_defaults ALTER COLUMN default_description SET NOT NULL;
ALTER TABLE template_defaults ALTER COLUMN personalization_level SET NOT NULL;

-- Drop old columns if they exist
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'template_defaults' AND column_name = 'default_consumer_title') THEN
    ALTER TABLE template_defaults DROP COLUMN default_consumer_title;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'template_defaults' AND column_name = 'default_consumer_description') THEN
    ALTER TABLE template_defaults DROP COLUMN default_consumer_description;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'template_defaults' AND column_name = 'default_display_image_source') THEN
    ALTER TABLE template_defaults DROP COLUMN default_display_image_source;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'template_defaults' AND column_name = 'title_variables') THEN
    ALTER TABLE template_defaults DROP COLUMN title_variables;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'template_defaults' AND column_name = 'description_variables') THEN
    ALTER TABLE template_defaults DROP COLUMN description_variables;
  END IF;
END $$;

-- Verify the migration
SELECT * FROM template_defaults; 