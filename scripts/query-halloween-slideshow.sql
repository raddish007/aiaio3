-- Query for Halloween theme images with all_ok safe zone for slideshow
-- This will find images suitable for lullaby video slideshow sections

SELECT 
    id,
    theme,
    file_url,
    tags,
    metadata->>'description' as description,
    metadata->'review'->>'safe_zone' as safe_zones,
    created_at,
    status
FROM assets 
WHERE 
    type = 'image' 
    AND status = 'approved'
    AND theme ILIKE '%halloween%'
    AND metadata->'review'->>'safe_zone' LIKE '%all_ok%'
ORDER BY created_at DESC;

-- Alternative query with more detailed safe zone parsing
-- This handles cases where safe_zone might be an array

SELECT 
    id,
    theme,
    file_url,
    tags,
    metadata->>'description' as description,
    metadata->'review'->'safe_zone' as safe_zones_array,
    created_at,
    status
FROM assets 
WHERE 
    type = 'image' 
    AND status = 'approved'
    AND theme ILIKE '%halloween%'
    AND (
        -- Check if safe_zone array contains 'all_ok'
        metadata->'review'->'safe_zone' ? 'all_ok'
        OR 
        -- Check if safe_zone string contains 'all_ok'
        metadata->'review'->>'safe_zone' LIKE '%all_ok%'
    )
ORDER BY created_at DESC;

-- Query to count total available slideshow images for halloween theme
SELECT 
    COUNT(*) as total_halloween_slideshow_images,
    COUNT(CASE WHEN metadata->'review'->'safe_zone' ? 'all_ok' THEN 1 END) as all_ok_count,
    COUNT(CASE WHEN metadata->'review'->>'safe_zone' LIKE '%all_ok%' THEN 1 END) as all_ok_string_count
FROM assets 
WHERE 
    type = 'image' 
    AND status = 'approved'
    AND theme ILIKE '%halloween%';

-- Query to see all safe zones for halloween images (for debugging)
SELECT 
    id,
    theme,
    metadata->'review'->'safe_zone' as safe_zones_array,
    metadata->'review'->>'safe_zone' as safe_zones_string,
    status
FROM assets 
WHERE 
    type = 'image' 
    AND status = 'approved'
    AND theme ILIKE '%halloween%'
ORDER BY created_at DESC; 