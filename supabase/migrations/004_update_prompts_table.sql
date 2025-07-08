-- Update prompts table to support project-based prompts and metadata
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES content_projects(id) ON DELETE CASCADE;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Enable RLS for prompts table
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- RLS policies for prompts
-- Admins can view all prompts
CREATE POLICY "Admins can view all prompts" ON prompts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Admins can insert prompts
CREATE POLICY "Admins can insert prompts" ON prompts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Admins can update prompts
CREATE POLICY "Admins can update prompts" ON prompts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Create index for prompts project_id
CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON prompts(project_id); 