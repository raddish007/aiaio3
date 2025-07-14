-- Migration: Published Videos Table
-- This migration creates a table for storing general published videos that are not tied to specific children

-- Create published_videos table for general videos
CREATE TABLE published_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Video content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  parent_tip TEXT,
  video_url VARCHAR(500) NOT NULL,
  display_image VARCHAR(500) DEFAULT '',
  
  -- Publishing info
  publish_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT true,
  
  -- Content categorization
  personalization_level video_personalization_level NOT NULL DEFAULT 'generic',
  child_theme VARCHAR(255) DEFAULT 'general',
  age_range VARCHAR(20) DEFAULT '3-5',
  
  -- Video metadata
  duration_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  
  -- Usage tracking
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin tracking
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_published_videos_published ON published_videos(is_published);
CREATE INDEX idx_published_videos_theme ON published_videos(child_theme);
CREATE INDEX idx_published_videos_age_range ON published_videos(age_range);
CREATE INDEX idx_published_videos_publish_date ON published_videos(publish_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_published_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_published_videos_updated_at
  BEFORE UPDATE ON published_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_published_videos_updated_at();

-- Add comments for documentation
COMMENT ON TABLE published_videos IS 'Table for storing general published videos that are not tied to specific children';
COMMENT ON COLUMN published_videos.title IS 'Video title displayed to users';
COMMENT ON COLUMN published_videos.description IS 'Video description for parents and children';
COMMENT ON COLUMN published_videos.parent_tip IS 'Educational tip for parents about this video';
COMMENT ON COLUMN published_videos.video_url IS 'Direct URL to video file (S3, CDN, etc.)';
COMMENT ON COLUMN published_videos.display_image IS 'Thumbnail image URL for video';
COMMENT ON COLUMN published_videos.personalization_level IS 'Level of personalization: generic, theme_specific, etc.';
COMMENT ON COLUMN published_videos.child_theme IS 'Theme category for the video content';
COMMENT ON COLUMN published_videos.age_range IS 'Target age range for the video';
COMMENT ON COLUMN published_videos.metadata IS 'Additional video metadata (tags, dimensions, upload info, etc.)';
