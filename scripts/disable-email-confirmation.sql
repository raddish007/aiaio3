-- Disable email confirmation requirement for development
-- Run this in your Supabase SQL Editor

-- Update auth settings to disable email confirmation
UPDATE auth.config 
SET enable_confirmations = false 
WHERE id = 1;

-- Alternative: Update the auth.users table to mark existing users as confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Check current auth settings
SELECT * FROM auth.config; 