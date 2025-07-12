-- Migration: Fix child_video_assignment_summary view to include assignment ID
-- This adds the missing assignment ID to the view

DROP VIEW IF EXISTS child_video_assignment_summary;

CREATE VIEW child_video_assignment_summary AS
SELECT 
    cva.id, -- Assignment ID - this was missing!
    c.id as child_id,
    c.name as child_name,
    c.age,
    c.primary_interest,
    u.email as parent_email,
    cva.template_type,
    cva.status,
    cva.priority,
    cva.assigned_at,
    cva.due_date,
    cva.started_at,
    cva.completed_at,
    cva.approved_at,
    cva.output_video_url,
    CASE 
        WHEN cva.status = 'assigned' THEN 'Waiting to start'
        WHEN cva.status = 'in_progress' THEN 'Being created'
        WHEN cva.status = 'completed' THEN 'Ready for review'
        WHEN cva.status = 'approved' THEN 'Complete'
        WHEN cva.status = 'rejected' THEN 'Needs revision'
        ELSE cva.status::text
    END as status_description,
    CASE 
        WHEN cva.due_date IS NOT NULL AND cva.due_date < CURRENT_DATE AND cva.status NOT IN ('approved', 'archived') THEN true
        ELSE false
    END as is_overdue
FROM children c
JOIN users u ON c.parent_id = u.id
LEFT JOIN child_video_assignments cva ON c.id = cva.child_id
ORDER BY c.name, cva.template_type;
