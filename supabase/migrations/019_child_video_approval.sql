-- Migration: Child Video Approval and Moderation System
-- This migration adds tables and enums for moderating and approving videos for child consumption

-- Create video approval status enum
CREATE TYPE video_approval_status AS ENUM (
  'pending_review',    -- Video generated, waiting for admin review
  'approved',          -- Approved for child consumption
  'rejected',          -- Rejected, not suitable for children
  'needs_revision'     -- Needs changes before approval
);

-- Create video personalization level enum
CREATE TYPE video_personalization_level AS ENUM (
  'generic',           -- No personalization, suitable for all children
  'theme_specific',    -- Theme-based, suitable for children with this theme
  'child_specific'     -- Personalized for specific child (name, age, etc.)
);

-- Create child_approved_videos table
CREATE TABLE child_approved_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Video identification
  video_generation_job_id UUID NOT NULL REFERENCES video_generation_jobs(id) ON DELETE CASCADE,
  video_url VARCHAR(500) NOT NULL,
  video_title VARCHAR(255) NOT NULL,
  
  -- Child and personalization info
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  child_name VARCHAR(255) NOT NULL,
  child_age INTEGER NOT NULL,
  child_theme VARCHAR(255) NOT NULL,
  personalization_level video_personalization_level NOT NULL DEFAULT 'child_specific',
  
  -- Approval workflow
  approval_status video_approval_status NOT NULL DEFAULT 'pending_review',
  submitted_by UUID NOT NULL REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  rejection_reason TEXT,
  
  -- Video metadata
  duration_seconds INTEGER,
  template_type VARCHAR(100) NOT NULL DEFAULT 'lullaby',
  template_data JSONB DEFAULT '{}',
  used_assets JSONB DEFAULT '[]', -- Array of asset IDs used in video
  
  -- Usage tracking
  times_watched INTEGER DEFAULT 0,
  last_watched_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_child_video UNIQUE(child_id, video_generation_job_id)
);

-- Create video moderation queue table
CREATE TABLE video_moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Video reference
  child_approved_video_id UUID NOT NULL REFERENCES child_approved_videos(id) ON DELETE CASCADE,
  
  -- Moderation info
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high
  
  -- Status
  status video_approval_status NOT NULL DEFAULT 'pending_review',
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video review history table
CREATE TABLE video_review_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Video reference
  child_approved_video_id UUID NOT NULL REFERENCES child_approved_videos(id) ON DELETE CASCADE,
  
  -- Review details
  reviewer_id UUID NOT NULL REFERENCES users(id),
  review_action video_approval_status NOT NULL,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_child_approved_videos_status ON child_approved_videos(approval_status);
CREATE INDEX idx_child_approved_videos_child_id ON child_approved_videos(child_id);
CREATE INDEX idx_child_approved_videos_personalization ON child_approved_videos(personalization_level);
CREATE INDEX idx_child_approved_videos_theme ON child_approved_videos(child_theme);
CREATE INDEX idx_child_approved_videos_template ON child_approved_videos(template_type);
CREATE INDEX idx_child_approved_videos_created_at ON child_approved_videos(created_at DESC);

CREATE INDEX idx_video_moderation_queue_status ON video_moderation_queue(status);
CREATE INDEX idx_video_moderation_queue_assigned ON video_moderation_queue(assigned_to);
CREATE INDEX idx_video_moderation_queue_priority ON video_moderation_queue(priority DESC);

CREATE INDEX idx_video_review_history_video_id ON video_review_history(child_approved_video_id);
CREATE INDEX idx_video_review_history_reviewer ON video_review_history(reviewer_id);
CREATE INDEX idx_video_review_history_created_at ON video_review_history(created_at DESC);

-- Enable RLS
ALTER TABLE child_approved_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_review_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for child_approved_videos
-- Parents can view approved videos for their children
CREATE POLICY "Parents can view approved videos for their children" ON child_approved_videos
  FOR SELECT USING (
    approval_status = 'approved' AND
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

-- Admins can view all videos
CREATE POLICY "Admins can view all child approved videos" ON child_approved_videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

-- RLS Policies for video_moderation_queue
-- Admins can view and manage moderation queue
CREATE POLICY "Admins can manage video moderation queue" ON video_moderation_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

-- RLS Policies for video_review_history
-- Admins can view review history
CREATE POLICY "Admins can view video review history" ON video_review_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_child_approved_videos_updated_at 
  BEFORE UPDATE ON child_approved_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_moderation_queue_updated_at 
  BEFORE UPDATE ON video_moderation_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create moderation queue entry
CREATE OR REPLACE FUNCTION create_video_moderation_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- When a child_approved_video is created, automatically add to moderation queue
  IF NEW.approval_status = 'pending_review' THEN
    INSERT INTO video_moderation_queue (
      child_approved_video_id,
      status,
      priority
    ) VALUES (
      NEW.id,
      'pending_review',
      CASE 
        WHEN NEW.personalization_level = 'child_specific' THEN 2
        WHEN NEW.personalization_level = 'theme_specific' THEN 1
        ELSE 1
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add videos to moderation queue
CREATE TRIGGER trigger_create_moderation_entry
  AFTER INSERT ON child_approved_videos
  FOR EACH ROW EXECUTE FUNCTION create_video_moderation_entry();

-- Add comments for documentation
COMMENT ON TABLE child_approved_videos IS 'Videos that have been approved for child consumption';
COMMENT ON TABLE video_moderation_queue IS 'Queue of videos waiting for admin review and approval';
COMMENT ON TABLE video_review_history IS 'History of all video review actions and decisions';
COMMENT ON COLUMN child_approved_videos.personalization_level IS 'Level of personalization: generic (all children), theme_specific (theme-based), child_specific (name/age specific)';
COMMENT ON COLUMN child_approved_videos.used_assets IS 'JSON array of asset IDs that were used in this video generation'; 