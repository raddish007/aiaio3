-- Check if the new columns exist in children table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'children' 
AND column_name IN ('child_description', 'pronouns', 'sidekick_description')
ORDER BY column_name;
