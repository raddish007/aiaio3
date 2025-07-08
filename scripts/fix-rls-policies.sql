-- Fix RLS Policies for AIAIO Platform
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Parents can view own children" ON children;
DROP POLICY IF EXISTS "Allow insert for all" ON users;
DROP POLICY IF EXISTS "Parents can insert own children" ON children;
DROP POLICY IF EXISTS "Parents can update own children" ON children;
DROP POLICY IF EXISTS "Parents can delete own children" ON children;
DROP POLICY IF EXISTS "Users can view assets" ON assets;
DROP POLICY IF EXISTS "Users can insert assets" ON assets;
DROP POLICY IF EXISTS "Users can update own assets" ON assets;
DROP POLICY IF EXISTS "Parents can view episodes" ON episodes;
DROP POLICY IF EXISTS "Parents can insert episodes" ON episodes;
DROP POLICY IF EXISTS "Parents can view content" ON content;
DROP POLICY IF EXISTS "Parents can insert content" ON content;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- 3. Create proper policies for users table
-- Allow users to insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 4. Create policies for children table
-- Allow authenticated users to insert children (for their own children)
CREATE POLICY "Parents can insert own children" ON children
    FOR INSERT WITH CHECK (parent_id = auth.uid());

-- Allow parents to view their own children
CREATE POLICY "Parents can view own children" ON children
    FOR SELECT USING (parent_id = auth.uid());

-- Allow parents to update their own children
CREATE POLICY "Parents can update own children" ON children
    FOR UPDATE USING (parent_id = auth.uid());

-- Allow parents to delete their own children
CREATE POLICY "Parents can delete own children" ON children
    FOR DELETE USING (parent_id = auth.uid());

-- 5. Create policies for assets table
-- Allow authenticated users to view assets
CREATE POLICY "Users can view assets" ON assets
    FOR SELECT USING (true);

-- Allow authenticated users to insert assets
CREATE POLICY "Users can insert assets" ON assets
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Allow asset creators to update their own assets
CREATE POLICY "Users can update own assets" ON assets
    FOR UPDATE USING (auth.uid() = created_by);

-- 6. Create policies for episodes table
-- Allow parents to view episodes for their children
CREATE POLICY "Parents can view episodes" ON episodes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = episodes.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Allow parents to insert episodes for their children
CREATE POLICY "Parents can insert episodes" ON episodes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = episodes.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- 7. Create policies for content table
-- Allow parents to view content for their children
CREATE POLICY "Parents can view content" ON content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = content.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Allow parents to insert content for their children
CREATE POLICY "Parents can insert content" ON content
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = content.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- 8. Create policies for notifications table
-- Allow users to view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Allow users to insert their own notifications
CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- 9. Create a function to handle user creation trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        'Unknown', -- We'll update this in the frontend
        'parent'::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger to automatically create user record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 11. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated; 