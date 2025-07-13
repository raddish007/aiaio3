-- Migration: Add status field to video metadata for approval workflow
-- This migration adds a status field to track whether consumer metadata has been approved

-- Create metadata status enum
CREATE TYPE video_metadata_status AS ENUM ('pending', 'approved', 'rejected');

-- Add status column to child_approved_videos table
ALTER TABLE child_approved_videos 
ADD COLUMN IF NOT EXISTS metadata_status video_metadata_status DEFAULT 'pending';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_child_approved_videos_metadata_status ON child_approved_videos(metadata_status);

-- Update existing videos to have approved metadata status if they have consumer metadata
UPDATE child_approved_videos 
SET metadata_status = 'approved' 
WHERE consumer_title IS NOT NULL 
  AND consumer_description IS NOT NULL 
  AND metadata_status = 'pending';

-- Add comment for documentation
COMMENT ON COLUMN child_approved_videos.metadata_status IS 'Status of consumer metadata: pending (needs review), approved (ready for publishing), rejected (needs revision)'; 