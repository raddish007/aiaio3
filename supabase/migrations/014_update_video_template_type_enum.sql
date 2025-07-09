-- Migration: Update video_template_type enum to allow more template types
-- This migration adds more values to the video_template_type enum

-- First, we need to create a new enum with additional values
CREATE TYPE video_template_type_new AS ENUM (
  'lullaby', 
  'name-video', 
  'letter-hunt', 
  'custom',
  'dev',
  'test',
  'bedtime',
  'educational',
  'entertainment',
  'story',
  'song',
  'game'
);

-- Update existing records to use valid enum values
UPDATE video_templates 
SET type = 'custom' 
WHERE type NOT IN ('lullaby', 'name-video', 'letter-hunt', 'custom');

-- Alter the table to use the new enum
ALTER TABLE video_templates 
ALTER COLUMN type TYPE video_template_type_new 
USING type::text::video_template_type_new;

-- Drop the old enum
DROP TYPE video_template_type;

-- Rename the new enum to the original name
ALTER TYPE video_template_type_new RENAME TO video_template_type; 