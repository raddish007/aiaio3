-- Migration: Add child video type assignments and approval tracking
-- This migration creates a proper system for tracking which video types 
-- each child should have and their approval status

-- Create assignment status enum
CREATE TYPE assignment_status AS ENUM ('assigned', 'in_progress', 'completed', 'approved', 'rejected', 'archived');

-- Create priority level enum  
CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'urgent');

-- Child video type assignments table
CREATE TABLE child_video_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    template_type video_template_type NOT NULL,
    status assignment_status NOT NULL DEFAULT 'assigned',
    priority priority_level NOT NULL DEFAULT 'normal',
    
    -- Assignment tracking
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date DATE,
    
    -- Progress tracking
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Approval tracking
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    rejected_by UUID REFERENCES users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    
    -- Asset and output tracking
    generated_assets JSONB DEFAULT '{}', -- Track which assets have been created
    output_video_url VARCHAR(500),
    template_instance_id UUID REFERENCES template_instances(id),
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Business rules
    UNIQUE(child_id, template_type), -- Each child can only have one active assignment per template type
    
    -- Constraints
    CONSTRAINT valid_status_dates CHECK (
        (status = 'in_progress' AND started_at IS NOT NULL) OR 
        (status != 'in_progress') OR 
        (started_at IS NULL)
    ),
    CONSTRAINT valid_completion_dates CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR 
        (status != 'completed') OR 
        (completed_at IS NULL)
    ),
    CONSTRAINT valid_approval_dates CHECK (
        (status = 'approved' AND approved_at IS NOT NULL AND approved_by IS NOT NULL) OR 
        (status != 'approved')
    ),
    CONSTRAINT valid_rejection_dates CHECK (
        (status = 'rejected' AND rejected_at IS NOT NULL AND rejected_by IS NOT NULL) OR 
        (status != 'rejected')
    )
);

-- Video assignment history table (for audit trail)
CREATE TABLE child_video_assignment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES child_video_assignments(id) ON DELETE CASCADE,
    previous_status assignment_status,
    new_status assignment_status NOT NULL,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_reason TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_child_video_assignments_child_id ON child_video_assignments(child_id);
CREATE INDEX idx_child_video_assignments_template_type ON child_video_assignments(template_type);
CREATE INDEX idx_child_video_assignments_status ON child_video_assignments(status);
CREATE INDEX idx_child_video_assignments_priority ON child_video_assignments(priority);
CREATE INDEX idx_child_video_assignments_assigned_by ON child_video_assignments(assigned_by);
CREATE INDEX idx_child_video_assignments_due_date ON child_video_assignments(due_date);
CREATE INDEX idx_child_video_assignments_approved_by ON child_video_assignments(approved_by);

CREATE INDEX idx_assignment_history_assignment_id ON child_video_assignment_history(assignment_id);
CREATE INDEX idx_assignment_history_changed_at ON child_video_assignment_history(changed_at);

-- Create function to automatically track status changes
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

-- Create trigger to automatically track status changes
CREATE TRIGGER track_assignment_status_changes_trigger
    AFTER UPDATE ON child_video_assignments
    FOR EACH ROW
    EXECUTE FUNCTION track_assignment_status_changes();

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_assignment_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    -- Set started_at when status changes to in_progress
    IF OLD.status != 'in_progress' AND NEW.status = 'in_progress' THEN
        NEW.started_at = NOW();
    END IF;
    
    -- Set completed_at when status changes to completed
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- Set approved_at when status changes to approved
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        NEW.approved_at = NOW();
    END IF;
    
    -- Set rejected_at when status changes to rejected
    IF OLD.status != 'rejected' AND NEW.status = 'rejected' THEN
        NEW.rejected_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
CREATE TRIGGER update_assignment_timestamps_trigger
    BEFORE UPDATE ON child_video_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_timestamps();

-- Row Level Security (RLS) policies
ALTER TABLE child_video_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_video_assignment_history ENABLE ROW LEVEL SECURITY;

-- Parents can see assignments for their children
CREATE POLICY parent_view_child_assignments ON child_video_assignments
    FOR SELECT USING (
        child_id IN (
            SELECT id FROM children WHERE parent_id = auth.uid()
        )
    );

-- Content managers and admins can see all assignments
CREATE POLICY admin_view_all_assignments ON child_video_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Similar policies for history table
CREATE POLICY parent_view_child_assignment_history ON child_video_assignment_history
    FOR SELECT USING (
        assignment_id IN (
            SELECT id FROM child_video_assignments 
            WHERE child_id IN (
                SELECT id FROM children WHERE parent_id = auth.uid()
            )
        )
    );

CREATE POLICY admin_view_all_assignment_history ON child_video_assignment_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Create helpful views
CREATE VIEW child_video_assignment_summary AS
SELECT 
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

-- Insert default assignments for existing children
-- This will assign lullaby videos to all existing children
INSERT INTO child_video_assignments (child_id, template_type, assigned_by, notes)
SELECT 
    c.id,
    'lullaby'::video_template_type,
    (SELECT id FROM users WHERE role = 'content_manager' LIMIT 1), -- Assign to first content manager
    'Default assignment created during migration'
FROM children c
WHERE NOT EXISTS (
    SELECT 1 FROM child_video_assignments cva 
    WHERE cva.child_id = c.id AND cva.template_type = 'lullaby'
);

-- Add comment
COMMENT ON TABLE child_video_assignments IS 'Tracks which video types each child should have and their approval status';
COMMENT ON TABLE child_video_assignment_history IS 'Audit trail for video assignment status changes';
COMMENT ON VIEW child_video_assignment_summary IS 'Comprehensive view of child video assignments with parent and status information';
