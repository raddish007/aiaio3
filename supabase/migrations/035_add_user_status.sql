-- Use existing subscription_status column for account lifecycle tracking
-- Possible values: 'lead', 'trial', 'active', 'paused', 'cancelled'
-- Add additional fields for lead tracking and trial management

-- Add fields for lead tracking and trial management
ALTER TABLE users 
ADD COLUMN lead_source TEXT DEFAULT 'registration_flow',
ADD COLUMN lead_metadata JSONB DEFAULT '{}',
ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_lead_source ON users(lead_source);
CREATE INDEX IF NOT EXISTS idx_users_converted_at ON users(converted_at);

-- Update existing users to have appropriate tracking data
UPDATE users 
SET converted_at = created_at,
    trial_started_at = CASE 
        WHEN subscription_status = 'trial' THEN created_at
        ELSE NULL
    END,
    trial_ends_at = CASE 
        WHEN subscription_status = 'trial' THEN created_at + INTERVAL '2 months'
        ELSE NULL
    END
WHERE subscription_status IN ('trial', 'active');
