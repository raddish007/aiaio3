-- Fix RLS policies for content_projects table
-- This allows proper access for the wish button functionality

-- First, let's disable RLS temporarily to see the table structure
ALTER TABLE content_projects DISABLE ROW LEVEL SECURITY;

-- Or alternatively, add proper policies for authenticated users
-- Re-enable RLS and add policies
ALTER TABLE content_projects ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (reading projects)
DROP POLICY IF EXISTS "Users can view content projects" ON content_projects;
CREATE POLICY "Users can view content projects" ON content_projects
    FOR SELECT USING (true);

-- Policy for INSERT (creating new projects)
DROP POLICY IF EXISTS "Users can create content projects" ON content_projects;
CREATE POLICY "Users can create content projects" ON content_projects
    FOR INSERT WITH CHECK (true);

-- Policy for UPDATE (updating existing projects)
DROP POLICY IF EXISTS "Users can update content projects" ON content_projects;
CREATE POLICY "Users can update content projects" ON content_projects
    FOR UPDATE USING (true);

-- Policy for DELETE (if needed)
DROP POLICY IF EXISTS "Users can delete content projects" ON content_projects;
CREATE POLICY "Users can delete content projects" ON content_projects
    FOR DELETE USING (true);

-- Verify the policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'content_projects';
