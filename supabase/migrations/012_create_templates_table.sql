-- Migration: Create templates table with enhanced asset type support
-- This migration creates the templates table and adds support for both asset classes and specific assets

-- Create the templates table
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(100) NOT NULL DEFAULT 'video',
  global_elements JSONB DEFAULT '[]'::jsonb,
  parts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to explain the structure
COMMENT ON TABLE templates IS 'Video templates with global elements and parts containing audio/image elements';
COMMENT ON COLUMN templates.global_elements IS 'JSON array of global elements with asset_type (class/specific), asset_class, and specific_asset fields';
COMMENT ON COLUMN templates.parts IS 'JSON array of template parts with audio_elements and image_elements, each supporting asset_type (class/specific)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at);

-- Add a function to validate template structure
CREATE OR REPLACE FUNCTION validate_template_structure(template_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if global_elements is an array
  IF jsonb_typeof(template_data->'global_elements') != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if parts is an array
  IF jsonb_typeof(template_data->'parts') != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Validate each global element has required fields
  FOR i IN 0..jsonb_array_length(template_data->'global_elements')-1 LOOP
    DECLARE
      element JSONB := template_data->'global_elements'->i;
    BEGIN
      IF NOT (element ? 'id' AND element ? 'type' AND element ? 'asset_purpose' AND element ? 'asset_type') THEN
        RETURN FALSE;
      END IF;
      
      -- Validate asset_type specific fields
      IF element->>'asset_type' = 'class' AND NOT (element ? 'asset_class') THEN
        RETURN FALSE;
      END IF;
      
      IF element->>'asset_type' = 'specific' AND NOT (element ? 'specific_asset_name') THEN
        RETURN FALSE;
      END IF;
    END;
  END LOOP;
  
  -- Validate each part has required structure
  FOR i IN 0..jsonb_array_length(template_data->'parts')-1 LOOP
    DECLARE
      part JSONB := template_data->'parts'->i;
    BEGIN
      IF NOT (part ? 'id' AND part ? 'name' AND part ? 'audio_elements' AND part ? 'image_elements') THEN
        RETURN FALSE;
      END IF;
      
      -- Validate audio elements
      FOR j IN 0..jsonb_array_length(part->'audio_elements')-1 LOOP
        DECLARE
          audio JSONB := part->'audio_elements'->j;
        BEGIN
          IF NOT (audio ? 'id' AND audio ? 'asset_purpose' AND audio ? 'asset_type') THEN
            RETURN FALSE;
          END IF;
          
          -- Validate asset_type specific fields
          IF audio->>'asset_type' = 'class' AND NOT (audio ? 'asset_class') THEN
            RETURN FALSE;
          END IF;
          
          IF audio->>'asset_type' = 'specific' AND NOT (audio ? 'specific_asset_name') THEN
            RETURN FALSE;
          END IF;
        END;
      END LOOP;
      
      -- Validate image elements
      FOR j IN 0..jsonb_array_length(part->'image_elements')-1 LOOP
        DECLARE
          image JSONB := part->'image_elements'->j;
        BEGIN
          IF NOT (image ? 'id' AND image ? 'asset_purpose' AND image ? 'asset_type') THEN
            RETURN FALSE;
          END IF;
          
          -- Validate asset_type specific fields
          IF image->>'asset_type' = 'class' AND NOT (image ? 'asset_class') THEN
            RETURN FALSE;
          END IF;
          
          IF image->>'asset_type' = 'specific' AND NOT (image ? 'specific_asset_name') THEN
            RETURN FALSE;
          END IF;
        END;
      END LOOP;
    END;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add a check constraint to ensure template structure is valid
ALTER TABLE templates 
ADD CONSTRAINT check_template_structure 
CHECK (validate_template_structure(jsonb_build_object(
  'global_elements', COALESCE(global_elements, '[]'::jsonb),
  'parts', COALESCE(parts, '[]'::jsonb)
)));

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Templates are viewable by authenticated users" ON templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Templates are insertable by authenticated users" ON templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Templates are updatable by authenticated users" ON templates
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Templates are deletable by authenticated users" ON templates
  FOR DELETE USING (auth.role() = 'authenticated'); 