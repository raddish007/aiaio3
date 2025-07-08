-- Add content_projects table for the new content creation workflow
CREATE TABLE content_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    theme VARCHAR(255) NOT NULL,
    target_age VARCHAR(50) NOT NULL,
    duration INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planning', -- 'planning', 'generating', 'reviewing', 'approved', 'video_ready'
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Add project_id column to assets table for linking assets to projects
ALTER TABLE assets ADD COLUMN project_id UUID REFERENCES content_projects(id) ON DELETE CASCADE;

-- Add prompt column to assets table for storing generation prompts
ALTER TABLE assets ADD COLUMN prompt TEXT;

-- Add url column to assets table for storing generated asset URLs
ALTER TABLE assets ADD COLUMN url VARCHAR(500);

-- Update asset_status enum to include new statuses
ALTER TYPE asset_status ADD VALUE IF NOT EXISTS 'generating';
ALTER TYPE asset_status ADD VALUE IF NOT EXISTS 'completed';

-- Create indexes for content_projects
CREATE INDEX idx_content_projects_status ON content_projects(status);
CREATE INDEX idx_content_projects_created_by ON content_projects(created_by);
CREATE INDEX idx_assets_project_id ON assets(project_id);

-- Enable RLS for content_projects
ALTER TABLE content_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_projects
-- Admins can view all projects
CREATE POLICY "Admins can view all content projects" ON content_projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Admins can insert projects
CREATE POLICY "Admins can insert content projects" ON content_projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Admins can update projects
CREATE POLICY "Admins can update content projects" ON content_projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Drop existing assets policies and recreate them
DROP POLICY IF EXISTS "Admins can view all assets" ON assets;
DROP POLICY IF EXISTS "Admins can insert assets" ON assets;
DROP POLICY IF EXISTS "Admins can update assets" ON assets;

-- Update assets RLS policies to include project-based access
CREATE POLICY "Admins can view all assets" ON assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

CREATE POLICY "Admins can insert assets" ON assets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

CREATE POLICY "Admins can update assets" ON assets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Create trigger for content_projects updated_at
CREATE TRIGGER update_content_projects_updated_at BEFORE UPDATE ON content_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 