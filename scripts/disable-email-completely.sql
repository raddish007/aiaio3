-- Completely disable email confirmation for development
-- Run this in your Supabase SQL Editor

-- 1. Disable email confirmations in auth config
UPDATE auth.config 
SET enable_confirmations = false;

-- 2. Mark all existing users as confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 3. Disable email provider if needed
UPDATE auth.providers 
SET enabled = false 
WHERE provider = 'email';

-- 4. Check current settings
SELECT 'Auth Config:' as info;
SELECT * FROM auth.config;

SELECT 'Email Provider:' as info;
SELECT * FROM auth.providers WHERE provider = 'email';

SELECT 'Users Status:' as info;
SELECT email, email_confirmed_at FROM auth.users LIMIT 5; 