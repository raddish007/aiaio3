-- Query to check all letter audio assets
SELECT 
  id,
  theme,
  metadata->>'letter' as letter,
  metadata->>'audio_class' as audio_class,
  status,
  created_at,
  metadata->>'personalization' as personalization
FROM assets 
WHERE type = 'audio' 
  AND metadata->>'audio_class' = 'letter_audio'
ORDER BY metadata->>'letter', created_at;

-- Count by letter
SELECT 
  metadata->>'letter' as letter,
  COUNT(*) as total_assets,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM assets 
WHERE type = 'audio' 
  AND metadata->>'audio_class' = 'letter_audio'
GROUP BY metadata->>'letter'
ORDER BY metadata->>'letter';

-- Check for assets missing letter field
SELECT 
  id,
  theme,
  status,
  created_at
FROM assets 
WHERE type = 'audio' 
  AND metadata->>'audio_class' = 'letter_audio'
  AND (metadata->>'letter' IS NULL OR metadata->>'letter' = '')
ORDER BY created_at;

-- Summary counts
SELECT 
  'Total letter audio assets' as metric,
  COUNT(*) as count
FROM assets 
WHERE type = 'audio' AND metadata->>'audio_class' = 'letter_audio'

UNION ALL

SELECT 
  'Approved letter audio assets' as metric,
  COUNT(*) as count
FROM assets 
WHERE type = 'audio' 
  AND metadata->>'audio_class' = 'letter_audio'
  AND status = 'approved'

UNION ALL

SELECT 
  'Unique letters available' as metric,
  COUNT(DISTINCT metadata->>'letter') as count
FROM assets 
WHERE type = 'audio' 
  AND metadata->>'audio_class' = 'letter_audio'
  AND metadata->>'letter' IS NOT NULL
  AND metadata->>'letter' != ''; 