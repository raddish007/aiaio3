-- Production RLS policies for content_projects table
-- This sets up proper security while allowing the wish button functionality

-- Ensure RLS is enabled
ALTER TABLE content_projects ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (reading projects) - allow authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to view content projects" ON content_projects;
CREATE POLICY "Allow authenticated users to view content projects" ON content_projects
    FOR SELECT USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

-- Policy for INSERT (creating new projects) - allow authenticated users and service role
DROP POLICY IF EXISTS "Allow authenticated users to create content projects" ON content_projects;
CREATE POLICY "Allow authenticated users to create content projects" ON content_projects
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

-- Policy for UPDATE (updating existing projects) - allow authenticated users and service role
DROP POLICY IF EXISTS "Allow authenticated users to update content projects" ON content_projects;
CREATE POLICY "Allow authenticated users to update content projects" ON content_projects
    FOR UPDATE USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

-- Policy for DELETE (if needed) - allow authenticated users and service role
DROP POLICY IF EXISTS "Allow authenticated users to delete content projects" ON content_projects;
CREATE POLICY "Allow authenticated users to delete content projects" ON content_projects
    FOR DELETE USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

-- Also ensure the prompts table has proper policies
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Prompts policies
DROP POLICY IF EXISTS "Allow authenticated users to view prompts" ON prompts;
CREATE POLICY "Allow authenticated users to view prompts" ON prompts
    FOR SELECT USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Allow authenticated users to create prompts" ON prompts;
CREATE POLICY "Allow authenticated users to create prompts" ON prompts
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

DROP POLICY IF EXISTS "Allow authenticated users to update prompts" ON prompts;
CREATE POLICY "Allow authenticated users to update prompts" ON prompts
    FOR UPDATE USING (
        auth.role() = 'authenticated' OR 
        auth.role() = 'service_role'
    );

-- Verify the policies are in place
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename IN ('content_projects', 'prompts')
ORDER BY tablename, policyname;
