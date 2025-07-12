-- Add title column to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add index for better performance on title searches
CREATE INDEX IF NOT EXISTS idx_assets_title ON assets(title);

-- Update existing assets to have a title based on their metadata if available
UPDATE assets 
SET title = COALESCE(
  metadata->>'imageType',
  metadata->>'assetPurpose', 
  metadata->'template_context'->>'asset_purpose',
  type::text || '_asset'
)
WHERE title IS NULL;
