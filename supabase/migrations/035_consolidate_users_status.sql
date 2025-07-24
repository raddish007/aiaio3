-- Add status column to users table to track account lifecycle
-- This replaces the separate leads table functionality

-- Add status column with enum type
CREATE TYPE user_status AS ENUM ('lead', 'trial', 'active', 'paused', 'cancelled');

ALTER TABLE users 
ADD COLUMN status user_status DEFAULT 'lead',
ADD COLUMN lead_source TEXT DEFAULT 'unknown',
ADD COLUMN lead_metadata JSONB DEFAULT '{}',
ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_lead_source ON users(lead_source);
CREATE INDEX IF NOT EXISTS idx_users_converted_at ON users(converted_at);

-- Update existing users to have 'active' status if they have subscription_status = 'active'
UPDATE users 
SET status = 'active', 
    converted_at = created_at 
WHERE subscription_status = 'active';

-- Update existing users to have 'trial' status if they have subscription_status = 'trial'
UPDATE users 
SET status = 'trial', 
    trial_started_at = created_at,
    trial_ends_at = created_at + INTERVAL '2 months'
WHERE subscription_status = 'trial';
