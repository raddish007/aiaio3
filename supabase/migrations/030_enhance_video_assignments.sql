-- Drop the view if it exists before recreating
DROP VIEW IF EXISTS child_available_videos;

-- Migration: Enhance video_assignments table for publishing tool
-- This migration adds assignment types and status tracking to the existing video_assignments table

-- Create assignment type enum if it does not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_assignment_type') THEN
        CREATE TYPE video_assignment_type AS ENUM ('individual', 'theme', 'general');
    END IF;
END $$;

-- Create assignment status enum if it does not exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_assignment_status') THEN
        CREATE TYPE video_assignment_status AS ENUM ('pending', 'published', 'archived');
    END IF;
END $$;

-- Add new columns to existing video_assignments table
ALTER TABLE video_assignments 
ADD COLUMN IF NOT EXISTS assignment_type video_assignment_type DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS theme VARCHAR(100), -- For theme-based assignments
ADD COLUMN IF NOT EXISTS status video_assignment_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Add constraints for valid assignment configurations
DO $$ BEGIN
    ALTER TABLE video_assignments 
    ADD CONSTRAINT valid_assignment_config CHECK (
        (assignment_type = 'individual' AND child_id IS NOT NULL AND theme IS NULL) OR
        (assignment_type = 'theme' AND child_id IS NULL AND theme IS NOT NULL) OR
        (assignment_type = 'general' AND child_id IS NULL AND theme IS NULL)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE video_assignments 
    ADD CONSTRAINT valid_publish_dates CHECK (
        (status = 'published' AND published_at IS NOT NULL) OR
        (status != 'published')
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE video_assignments 
    ADD CONSTRAINT valid_archive_dates CHECK (
        (status = 'archived' AND archived_at IS NOT NULL) OR
        (status != 'archived')
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_video_assignments_theme ON video_assignments(theme);
CREATE INDEX IF NOT EXISTS idx_video_assignments_assignment_type ON video_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_video_assignments_status ON video_assignments(status);

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_video_assignment_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Set published_at when status changes to published
    IF OLD.status != 'published' AND NEW.status = 'published' THEN
        NEW.published_at = NOW();
    END IF;
    
    -- Set archived_at when status changes to archived
    IF OLD.status != 'archived' AND NEW.status = 'archived' THEN
        NEW.archived_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
DROP TRIGGER IF EXISTS update_video_assignment_timestamps_trigger ON video_assignments;
CREATE TRIGGER update_video_assignment_timestamps_trigger
    BEFORE UPDATE ON video_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_video_assignment_timestamps();

-- Update existing RLS policies to include new assignment types
DROP POLICY IF EXISTS "Parents can view video assignments for their children" ON video_assignments;
CREATE POLICY "Parents can view video assignments for their children" ON video_assignments
    FOR SELECT USING (
        (assignment_type = 'individual' AND child_id IN (
            SELECT id FROM children WHERE parent_id = auth.uid()
        )) OR
        (assignment_type = 'theme' AND theme IN (
            SELECT DISTINCT primary_interest FROM children WHERE parent_id = auth.uid()
        )) OR
        (assignment_type = 'general')
    );

-- Create helpful view for consumer gallery
CREATE OR REPLACE VIEW child_available_videos AS
SELECT 
    cav.id as video_id,
    cav.video_title as title,
    cav.template_type as video_type,
    cav.consumer_title,
    cav.consumer_description,
    cav.parent_tip,
    cav.display_image_url,
    cav.video_url,
    cav.created_at,
    cav.reviewed_at as approved_at,
    va.id as assignment_id,
    va.assignment_type,
    va.publish_date,
    va.status as assignment_status,
    va.published_at,
    c.id as child_id,
    c.name as child_name,
    c.primary_interest as child_theme,
    u.id as parent_id,
    u.email as parent_email
FROM child_approved_videos cav
JOIN video_assignments va ON cav.id = va.video_id
LEFT JOIN children c ON (
    (va.assignment_type = 'individual' AND va.child_id = c.id) OR
    (va.assignment_type = 'theme' AND va.theme = c.primary_interest) OR
    (va.assignment_type = 'general')
)
LEFT JOIN users u ON c.parent_id = u.id
WHERE va.status = 'published' 
  AND va.publish_date <= CURRENT_DATE
ORDER BY va.published_at DESC, cav.reviewed_at DESC;

-- (No RLS policy for views; RLS is enforced on underlying tables) 