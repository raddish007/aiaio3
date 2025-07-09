-- Migration: Make structure column nullable in video_templates
-- Since we're now using global_elements and parts columns instead of structure

-- Make the structure column nullable
ALTER TABLE video_templates 
ALTER COLUMN structure DROP NOT NULL;

-- Add a default value for existing records that might be null
UPDATE video_templates 
SET structure = '{}'::jsonb 
WHERE structure IS NULL;

-- Add a comment to explain the change
COMMENT ON COLUMN video_templates.structure IS 'Legacy column - now using global_elements and parts instead. Kept for backward compatibility.'; 