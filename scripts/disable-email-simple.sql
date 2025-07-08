-- Simple approach to disable email confirmation
-- Run this in your Supabase SQL Editor

-- 1. Mark all existing users as confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Check current users
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Alternative: Update specific user (replace with your email)
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email = 'your-email@example.com'; 