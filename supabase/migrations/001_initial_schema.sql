-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('parent', 'content_manager', 'asset_creator', 'video_ops');
CREATE TYPE content_type AS ENUM ('initial', 'weekly_episode', 'segment');
CREATE TYPE content_status AS ENUM ('pending', 'in_progress', 'ready', 'delivered', 'failed');
CREATE TYPE asset_type AS ENUM ('image', 'audio', 'video', 'prompt');
CREATE TYPE asset_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE job_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
CREATE TYPE notification_type AS ENUM ('email', 'in_app');

-- Users table (parents and admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'parent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    subscription_status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}'
);

-- Children table
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    primary_interest VARCHAR(255) NOT NULL,
    profile_photo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Assets table (content library)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type asset_type NOT NULL,
    theme VARCHAR(255) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    age_range VARCHAR(50),
    safe_zone VARCHAR(100),
    status asset_status NOT NULL DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approval_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    file_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0
);

-- Prompts table (for AI generation)
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_type asset_type NOT NULL,
    theme VARCHAR(255) NOT NULL,
    style VARCHAR(255),
    safe_zone VARCHAR(100),
    prompt_text TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending'
);

-- Asset generation jobs
CREATE TABLE asset_generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID REFERENCES prompts(id),
    status job_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    output_asset_id UUID REFERENCES assets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Episodes table
CREATE TABLE episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    delivery_date DATE NOT NULL,
    status content_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assembly_log JSONB DEFAULT '[]',
    qa_status VARCHAR(50) DEFAULT 'pending',
    UNIQUE(child_id, episode_number)
);

-- Content segments table
CREATE TABLE content_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'personalized', 'contextual', 'generic'
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(500),
    order_index INTEGER NOT NULL,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Content table (for initial videos and tracking)
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    type content_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500),
    status content_status NOT NULL DEFAULT 'pending',
    delivery_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Video generation jobs
CREATE TABLE video_generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID REFERENCES children(id),
    episode_id UUID REFERENCES episodes(id),
    content_id UUID REFERENCES content(id),
    status job_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    segments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'sent',
    metadata JSONB DEFAULT '{}'
);

-- Analytics table
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(100) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    period VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    related_entity_type VARCHAR(50), -- 'asset', 'episode', 'user', etc.
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_children_parent_id ON children(parent_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_theme ON assets(theme);
CREATE INDEX idx_episodes_child_id ON episodes(child_id);
CREATE INDEX idx_episodes_delivery_date ON episodes(delivery_date);
CREATE INDEX idx_content_child_id ON content(child_id);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_analytics_metric_type ON analytics(metric_type);
CREATE INDEX idx_analytics_period ON analytics(period);

-- Create RLS policies (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Parents can only see their own children
CREATE POLICY "Parents can view own children" ON children
    FOR ALL USING (parent_id = auth.uid());

-- Parents can only see their children's content
CREATE POLICY "Parents can view own children content" ON content
    FOR ALL USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

-- Parents can only see their children's episodes
CREATE POLICY "Parents can view own children episodes" ON episodes
    FOR ALL USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

-- Parents can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR ALL USING (user_id = auth.uid());

-- Admins can view all assets
CREATE POLICY "Admins can view all assets" ON assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL; 