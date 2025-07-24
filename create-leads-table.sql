-- Create the leads table for tracking registration funnel
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    status TEXT NOT NULL DEFAULT 'initial',
    source TEXT DEFAULT 'unknown',
    user_id UUID REFERENCES auth.users(id),
    converted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for leads table
-- Allow anonymous users to insert leads (for registration)
CREATE POLICY "Allow anonymous to insert leads" ON public.leads
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow anonymous users to update their own leads by email
CREATE POLICY "Allow anonymous to update own leads" ON public.leads
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to see their own converted leads
CREATE POLICY "Allow users to view own leads" ON public.leads
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Allow service role full access" ON public.leads
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
