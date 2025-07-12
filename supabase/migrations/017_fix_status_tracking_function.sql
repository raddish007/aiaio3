-- Migration: Fix track_assignment_status_changes function
-- Fixes reference to non-existent updated_by column

-- Drop the trigger first
DROP TRIGGER IF EXISTS track_assignment_status_changes_trigger ON child_video_assignments;

-- Drop and recreate the function with correct column references
DROP FUNCTION IF EXISTS track_assignment_status_changes();

CREATE OR REPLACE FUNCTION track_assignment_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO child_video_assignment_history (
            assignment_id,
            previous_status,
            new_status,
            changed_by,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            CASE 
                WHEN NEW.status = 'approved' THEN NEW.approved_by
                WHEN NEW.status = 'rejected' THEN NEW.rejected_by
                ELSE NULL
            END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'Video approved'
                WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
                WHEN NEW.status = 'completed' THEN 'Video generation completed'
                WHEN NEW.status = 'in_progress' THEN 'Video generation started'
                ELSE 'Status updated'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER track_assignment_status_changes_trigger
    AFTER UPDATE ON child_video_assignments
    FOR EACH ROW
    EXECUTE FUNCTION track_assignment_status_changes();
