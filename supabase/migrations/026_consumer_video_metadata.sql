-- Migration: Consumer Video Metadata and Publishing System
-- This migration adds consumer-facing metadata and publishing workflow to videos

-- Add consumer-facing metadata columns to child_approved_videos table
ALTER TABLE child_approved_videos 
ADD COLUMN IF NOT EXISTS consumer_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS consumer_description TEXT,
ADD COLUMN IF NOT EXISTS parent_tip TEXT,
ADD COLUMN IF NOT EXISTS display_image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS display_image_source VARCHAR(50) DEFAULT 'custom',
ADD COLUMN IF NOT EXISTS selected_asset_id UUID REFERENCES assets(id),
ADD COLUMN IF NOT EXISTS publish_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Create video assignments table for publishing workflow
CREATE TABLE IF NOT EXISTS video_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES child_approved_videos(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE, -- NULL for general assignments
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  publish_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_assignments_video_id ON video_assignments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_assignments_child_id ON video_assignments(child_id);
CREATE INDEX IF NOT EXISTS idx_video_assignments_publish_date ON video_assignments(publish_date);
CREATE INDEX IF NOT EXISTS idx_video_assignments_active ON video_assignments(is_active);

-- Add indexes for new columns in child_approved_videos
CREATE INDEX IF NOT EXISTS idx_child_approved_videos_published ON child_approved_videos(is_published);
CREATE INDEX IF NOT EXISTS idx_child_approved_videos_publish_date ON child_approved_videos(publish_date);
CREATE INDEX IF NOT EXISTS idx_child_approved_videos_consumer_title ON child_approved_videos(consumer_title);

-- Enable RLS for video_assignments
ALTER TABLE video_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_assignments
-- Parents can view assignments for their children
CREATE POLICY "Parents can view video assignments for their children" ON video_assignments
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE parent_id = auth.uid()
    )
  );

-- Admins can manage all video assignments
CREATE POLICY "Admins can manage all video assignments" ON video_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

-- Add comments for documentation
COMMENT ON COLUMN child_approved_videos.consumer_title IS 'Consumer-facing title for the video gallery';
COMMENT ON COLUMN child_approved_videos.consumer_description IS 'Consumer-facing description for the video gallery';
COMMENT ON COLUMN child_approved_videos.parent_tip IS '2-5 sentence tip for parents about the video';
COMMENT ON COLUMN child_approved_videos.display_image_url IS 'URL for the display image in the video gallery';
COMMENT ON COLUMN child_approved_videos.display_image_source IS 'Source of display image: custom, thumbnail, or asset';
COMMENT ON COLUMN child_approved_videos.selected_asset_id IS 'Asset ID if display image is selected from video assets';
COMMENT ON COLUMN child_approved_videos.publish_date IS 'Date when video should be published to consumers';
COMMENT ON COLUMN child_approved_videos.is_published IS 'Whether the video is currently published to consumers';

COMMENT ON TABLE video_assignments IS 'Assignments of videos to children or general audience for publishing';
COMMENT ON COLUMN video_assignments.child_id IS 'Child ID for specific assignment, NULL for general assignment';
COMMENT ON COLUMN video_assignments.publish_date IS 'Date when this assignment should be published';
COMMENT ON COLUMN video_assignments.is_active IS 'Whether this assignment is currently active'; 