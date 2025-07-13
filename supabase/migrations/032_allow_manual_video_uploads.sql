-- Migration: Allow Manual Video Uploads
-- This migration modifies the child_approved_videos table to support manually uploaded videos

-- Add a field to distinguish between generated and manually uploaded videos
ALTER TABLE child_approved_videos 
ADD COLUMN video_source VARCHAR(50) DEFAULT 'generated' CHECK (video_source IN ('generated', 'manual_upload'));

-- Make video_generation_job_id optional for manually uploaded videos
ALTER TABLE child_approved_videos 
ALTER COLUMN video_generation_job_id DROP NOT NULL;

-- Add a constraint to ensure video_generation_job_id is required for generated videos
ALTER TABLE child_approved_videos 
ADD CONSTRAINT check_video_generation_job_id 
CHECK (
  (video_source = 'generated' AND video_generation_job_id IS NOT NULL) OR
  (video_source = 'manual_upload' AND video_generation_job_id IS NULL)
);

-- Update the unique constraint to handle null video_generation_job_id
DROP INDEX IF EXISTS unique_child_video;
ALTER TABLE child_approved_videos 
DROP CONSTRAINT IF EXISTS unique_child_video;

-- Create a new unique constraint that handles null values
CREATE UNIQUE INDEX unique_child_video_generated 
ON child_approved_videos (child_id, video_generation_job_id) 
WHERE video_generation_job_id IS NOT NULL;

-- For manually uploaded videos, we'll use a different uniqueness constraint
CREATE UNIQUE INDEX unique_child_video_manual 
ON child_approved_videos (video_url) 
WHERE video_source = 'manual_upload';

-- Add comments for documentation
COMMENT ON COLUMN child_approved_videos.video_source IS 'Source of the video: generated (via Remotion) or manual_upload (uploaded directly)';
COMMENT ON COLUMN child_approved_videos.video_generation_job_id IS 'Reference to video generation job (required for generated videos, null for manual uploads)'; 