-- Fix RLS policies for admin users to access lullaby-projects page
-- This allows content managers, asset creators, and video ops to view all users and children

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Parents can view own children" ON children;

-- Create new policies that allow admins to see all data
CREATE POLICY "Users can view own profile or admin can view all" ON users
    FOR SELECT USING (
        auth.uid() = id 
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

CREATE POLICY "Parents can view own children or admin can view all" ON children
    FOR SELECT USING (
        parent_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Also fix content policies to allow admins to see all content
DROP POLICY IF EXISTS "Parents can view own children content" ON content;

CREATE POLICY "Parents can view own children content or admin can view all" ON content
    FOR SELECT USING (
        child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Allow admins to insert content for any child
CREATE POLICY "Admins can insert content" ON content
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Allow admins to update content
CREATE POLICY "Admins can update content" ON content
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    ); 