-- Run this SQL in your Supabase SQL editor to create the published_videos table
-- This will enable proper general video storage instead of using the fallback

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
  personalization_level VARCHAR(50) NOT NULL DEFAULT 'generic',
  child_theme VARCHAR(255) DEFAULT 'general',
  age_range VARCHAR(20) DEFAULT '3-5',
  
  -- Video metadata
  duration_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  
  -- Usage tracking
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Admin tracking
  created_by UUID,
  updated_by UUID,
  
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

-- Add RLS policies (adjust as needed for your security requirements)
ALTER TABLE published_videos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read published videos
CREATE POLICY "Allow authenticated users to read published videos" ON published_videos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Allow service role full access" ON published_videos
    FOR ALL USING (auth.role() = 'service_role');
