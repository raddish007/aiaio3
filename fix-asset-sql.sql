-- Update the metadata for the specific asset to include assetPurpose
UPDATE assets 
SET metadata = metadata || '{"assetPurpose": "titleAudio"}'::jsonb
WHERE id = '906c5cd3-3816-43be-a0ee-80877f1948d8';

-- Verify the update
SELECT id, metadata->>'assetPurpose' as asset_purpose, metadata 
FROM assets 
WHERE id = '906c5cd3-3816-43be-a0ee-80877f1948d8';
