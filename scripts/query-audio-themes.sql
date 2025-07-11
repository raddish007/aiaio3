-- Query audio assets with themes containing specific letters
-- For testing the updated audio trimmer functionality

-- 1. Audio assets with theme containing 'L'
SELECT 
    id,
    theme,
    type,
    status,
    file_url,
    created_at,
    metadata->>'duration' as duration_seconds,
    metadata->>'generation_method' as generation_method
FROM assets 
WHERE type = 'audio' 
    AND theme ILIKE '%L%'
    AND status = 'approved'
ORDER BY created_at DESC;

-- 2. Audio assets with theme containing 'O'
SELECT 
    id,
    theme,
    type,
    status,
    file_url,
    created_at,
    metadata->>'duration' as duration_seconds,
    metadata->>'generation_method' as generation_method
FROM assets 
WHERE type = 'audio' 
    AND theme ILIKE '%O%'
    AND status = 'approved'
ORDER BY created_at DESC;

-- 3. Audio assets with theme containing 'R'
SELECT 
    id,
    theme,
    type,
    status,
    file_url,
    created_at,
    metadata->>'duration' as duration_seconds,
    metadata->>'generation_method' as generation_method
FROM assets 
WHERE type = 'audio' 
    AND theme ILIKE '%R%'
    AND status = 'approved'
ORDER BY created_at DESC;

-- 4. Audio assets with theme containing 'E'
SELECT 
    id,
    theme,
    type,
    status,
    file_url,
    created_at,
    metadata->>'duration' as duration_seconds,
    metadata->>'generation_method' as generation_method
FROM assets 
WHERE type = 'audio' 
    AND theme ILIKE '%E%'
    AND status = 'approved'
ORDER BY created_at DESC;

-- 5. Audio assets with theme containing 'I'
SELECT 
    id,
    theme,
    type,
    status,
    file_url,
    created_at,
    metadata->>'duration' as duration_seconds,
    metadata->>'generation_method' as generation_method
FROM assets 
WHERE type = 'audio' 
    AND theme ILIKE '%I%'
    AND status = 'approved'
ORDER BY created_at DESC;

-- 6. Combined query: Audio assets with themes containing ANY of L, O, R, E, I
SELECT 
    id,
    theme,
    type,
    status,
    file_url,
    created_at,
    metadata->>'duration' as duration_seconds,
    metadata->>'generation_method' as generation_method,
    CASE 
        WHEN theme ILIKE '%L%' THEN 'L'
        WHEN theme ILIKE '%O%' THEN 'O'
        WHEN theme ILIKE '%R%' THEN 'R'
        WHEN theme ILIKE '%E%' THEN 'E'
        WHEN theme ILIKE '%I%' THEN 'I'
    END as matched_letter
FROM assets 
WHERE type = 'audio' 
    AND (
        theme ILIKE '%L%' OR 
        theme ILIKE '%O%' OR 
        theme ILIKE '%R%' OR 
        theme ILIKE '%E%' OR 
        theme ILIKE '%I%'
    )
    AND status = 'approved'
ORDER BY created_at DESC;

-- 7. Count of audio assets by letter in theme
SELECT 
    'L' as letter,
    COUNT(*) as count
FROM assets 
WHERE type = 'audio' AND theme ILIKE '%L%' AND status = 'approved'
UNION ALL
SELECT 
    'O' as letter,
    COUNT(*) as count
FROM assets 
WHERE type = 'audio' AND theme ILIKE '%O%' AND status = 'approved'
UNION ALL
SELECT 
    'R' as letter,
    COUNT(*) as count
FROM assets 
WHERE type = 'audio' AND theme ILIKE '%R%' AND status = 'approved'
UNION ALL
SELECT 
    'E' as letter,
    COUNT(*) as count
FROM assets 
WHERE type = 'audio' AND theme ILIKE '%E%' AND status = 'approved'
UNION ALL
SELECT 
    'I' as letter,
    COUNT(*) as count
FROM assets 
WHERE type = 'audio' AND theme ILIKE '%I%' AND status = 'approved'
ORDER BY letter;

-- 8. Audio assets with themes containing ALL letters L, O, R, E, I (for "LOREI" or similar)
SELECT 
    id,
    theme,
    type,
    status,
    file_url,
    created_at,
    metadata->>'duration' as duration_seconds,
    metadata->>'generation_method' as generation_method
FROM assets 
WHERE type = 'audio' 
    AND theme ILIKE '%L%'
    AND theme ILIKE '%O%'
    AND theme ILIKE '%R%'
    AND theme ILIKE '%E%'
    AND theme ILIKE '%I%'
    AND status = 'approved'
ORDER BY created_at DESC;

-- 9. Recent audio assets (last 30 days) with any of the letters
SELECT 
    id,
    theme,
    type,
    status,
    file_url,
    created_at,
    metadata->>'duration' as duration_seconds,
    metadata->>'generation_method' as generation_method
FROM assets 
WHERE type = 'audio' 
    AND (
        theme ILIKE '%L%' OR 
        theme ILIKE '%O%' OR 
        theme ILIKE '%R%' OR 
        theme ILIKE '%E%' OR 
        theme ILIKE '%I%'
    )
    AND status = 'approved'
    AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- 10. Audio assets with file_url containing .mp3 (to verify MP3 format)
SELECT 
    id,
    theme,
    type,
    status,
    file_url,
    created_at,
    metadata->>'duration' as duration_seconds,
    metadata->>'generation_method' as generation_method
FROM assets 
WHERE type = 'audio' 
    AND file_url LIKE '%.mp3'
    AND (
        theme ILIKE '%L%' OR 
        theme ILIKE '%O%' OR 
        theme ILIKE '%R%' OR 
        theme ILIKE '%E%' OR 
        theme ILIKE '%I%'
    )
    AND status = 'approved'
ORDER BY created_at DESC; 