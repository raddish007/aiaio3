-- Video Templates and Assignments
-- Migration: 007_video_templates.sql

-- Create video template types enum
CREATE TYPE video_template_type AS ENUM ('lullaby', 'name-video', 'letter-hunt', 'custom');
CREATE TYPE video_part_type AS ENUM ('intro', 'slideshow', 'outro');
CREATE TYPE personalization_type AS ENUM ('generic', 'name_substitution', 'child_specific');

-- Video templates table
CREATE TABLE video_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type video_template_type NOT NULL,
    structure JSONB NOT NULL, -- Stores the video structure with parts and assets
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- Template asset assignments table
CREATE TABLE template_asset_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES video_templates(id) ON DELETE CASCADE,
    asset_purpose VARCHAR(255) NOT NULL, -- e.g., 'background_music', 'intro_audio'
    assigned_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    UNIQUE(template_id, asset_purpose)
);

-- Template instances for specific children
CREATE TABLE template_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES video_templates(id),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_video_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    UNIQUE(template_id, child_id)
);

-- Create indexes
CREATE INDEX idx_video_templates_type ON video_templates(type);
CREATE INDEX idx_video_templates_created_by ON video_templates(created_by);
CREATE INDEX idx_template_assignments_template_id ON template_asset_assignments(template_id);
CREATE INDEX idx_template_assignments_asset_id ON template_asset_assignments(assigned_asset_id);
CREATE INDEX idx_template_instances_template_id ON template_instances(template_id);
CREATE INDEX idx_template_instances_child_id ON template_instances(child_id);

-- Enable RLS
ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_templates
CREATE POLICY "Admins can manage video templates" ON video_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- RLS Policies for template_asset_assignments
CREATE POLICY "Admins can manage template assignments" ON template_asset_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- RLS Policies for template_instances
CREATE POLICY "Admins can manage template instances" ON template_instances
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Add updated_at triggers
CREATE TRIGGER update_video_templates_updated_at BEFORE UPDATE ON video_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_instances_updated_at BEFORE UPDATE ON template_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 