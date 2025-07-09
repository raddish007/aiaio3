-- Migration: Update video_templates table structure to match code expectations
-- This migration adds the missing columns that the template management code expects

-- Add the missing columns to video_templates table
ALTER TABLE video_templates 
ADD COLUMN IF NOT EXISTS global_elements JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS parts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS template_type VARCHAR(100) DEFAULT 'video';

-- Update existing records to migrate data from structure column if needed
-- For now, we'll leave the structure column as is for backward compatibility

-- Add comments to explain the new structure
COMMENT ON COLUMN video_templates.global_elements IS 'JSON array of global elements with asset_type (class/specific), asset_class, and specific_asset fields';
COMMENT ON COLUMN video_templates.parts IS 'JSON array of template parts with audio_elements and image_elements, each supporting asset_type (class/specific)';
COMMENT ON COLUMN video_templates.template_type IS 'Type of template (lullaby, name-video, letter-hunt, custom)';

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_video_templates_template_type ON video_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_video_templates_global_elements ON video_templates USING GIN(global_elements);
CREATE INDEX IF NOT EXISTS idx_video_templates_parts ON video_templates USING GIN(parts); 