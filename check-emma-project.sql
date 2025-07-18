-- Check Emma's project details and assets
SELECT 
    cp.id,
    cp.title,
    cp.status,
    cp.metadata,
    cp.created_at
FROM content_projects cp 
WHERE cp.id LIKE 'efb969d4%';

-- Check Emma's assets
SELECT 
    a.id,
    a.asset_type,
    a.asset_subtype,
    a.status,
    a.file_url,
    a.metadata
FROM assets a
JOIN content_projects cp ON a.project_id = cp.id
WHERE cp.id LIKE 'efb969d4%'
ORDER BY a.asset_type, a.asset_subtype;

-- Count Emma's assets by type and status
SELECT 
    a.asset_type,
    a.status,
    COUNT(*) as count
FROM assets a
JOIN content_projects cp ON a.project_id = cp.id
WHERE cp.id LIKE 'efb969d4%'
GROUP BY a.asset_type, a.status
ORDER BY a.asset_type, a.status;
