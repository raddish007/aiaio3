-- Create leads table for tracking registration funnel
-- This allows us to follow up with users who don't complete full registration

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'step_1_complete',
  source VARCHAR(100) DEFAULT 'registration_flow',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at);
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON leads(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Row Level Security)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow public to insert leads (for registration flow)
CREATE POLICY "Allow public to insert leads" ON leads
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Allow authenticated users to read their own lead record
CREATE POLICY "Users can read their own lead" ON leads
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR email = auth.jwt() ->> 'email');

-- Allow service role to manage all leads (for admin/analytics)
CREATE POLICY "Service role can manage all leads" ON leads
    FOR ALL TO service_role
    USING (true);

-- Comments for documentation
COMMENT ON TABLE leads IS 'Tracks user registration funnel progress for follow-up campaigns';
COMMENT ON COLUMN leads.status IS 'Current registration status: step_1_complete, step_2_complete, converted, abandoned';
COMMENT ON COLUMN leads.source IS 'Where the lead came from: registration_flow, landing_page, etc.';
COMMENT ON COLUMN leads.metadata IS 'Additional data like step progress, child info, utm params, etc.';
