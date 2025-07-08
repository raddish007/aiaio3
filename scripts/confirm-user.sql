-- Manually confirm a user's email
-- Replace 'your-email@example.com' with the actual email you used

UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'your-email@example.com';

-- Check if it worked
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'your-email@example.com'; 