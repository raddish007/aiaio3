-- Check for existing prompts in the database that might be interfering
SELECT 
    p.id,
    p.project_id,
    p.asset_type,
    p.prompt_text,
    p.status,
    p.created_at,
    p.metadata->>'page' as page,
    p.metadata->>'template' as template,
    p.metadata->>'child_name' as child_name
FROM prompts p
WHERE p.metadata->>'template' = 'wish-button'
ORDER BY p.created_at DESC
LIMIT 20;

-- Check content_projects for wish-button entries
SELECT 
    id,
    title,
    status,
    created_at,
    metadata->>'template' as template,
    metadata->>'child_name' as child_name,
    metadata->'generatedPrompts' as generated_prompts
FROM content_projects
WHERE metadata->>'template' = 'wish-button'
ORDER BY created_at DESC
LIMIT 10;
