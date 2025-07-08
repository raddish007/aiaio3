-- Temporarily disable RLS to fix admin access issues
-- This allows admin users to access all data while we fix the RLS policies

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE children DISABLE ROW LEVEL SECURITY;
ALTER TABLE content DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE episodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Add a comment to remind us to re-enable RLS later
COMMENT ON TABLE users IS 'RLS temporarily disabled for admin access - TODO: fix RLS policies';
COMMENT ON TABLE children IS 'RLS temporarily disabled for admin access - TODO: fix RLS policies';
COMMENT ON TABLE content IS 'RLS temporarily disabled for admin access - TODO: fix RLS policies';
COMMENT ON TABLE assets IS 'RLS temporarily disabled for admin access - TODO: fix RLS policies';
COMMENT ON TABLE episodes IS 'RLS temporarily disabled for admin access - TODO: fix RLS policies';
COMMENT ON TABLE notifications IS 'RLS temporarily disabled for admin access - TODO: fix RLS policies'; 