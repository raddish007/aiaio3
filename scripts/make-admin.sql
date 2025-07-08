-- Make a user an admin
-- Run this in your Supabase SQL Editor

-- Option 1: Make specific user admin (replace with your email)
UPDATE users 
SET role = 'content_manager' 
WHERE email = 'admin@aiaio.com';

-- Option 2: Make user admin by ID (replace with actual user ID)
-- UPDATE users 
-- SET role = 'content_manager' 
-- WHERE id = 'your-user-id-here';

-- Check the result
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'admin@aiaio.com';

-- Show all users and their roles
SELECT id, email, name, role, created_at 
FROM users 
ORDER BY created_at DESC; 