-- Quick fix: Disable RLS on content_projects for development
-- Run this in your Supabase SQL editor

ALTER TABLE content_projects DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'content_projects';
