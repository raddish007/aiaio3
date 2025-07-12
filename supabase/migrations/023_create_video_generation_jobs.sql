-- Create video_generation_jobs table
CREATE TABLE IF NOT EXISTS video_generation_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES video_templates(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'processing', 'completed', 'failed')),
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assets JSONB NOT NULL DEFAULT '[]',
  template_data JSONB NOT NULL DEFAULT '{}',
  lambda_request_id TEXT,
  output_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_generation_jobs_status ON video_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_generation_jobs_submitted_by ON video_generation_jobs(submitted_by);
CREATE INDEX IF NOT EXISTS idx_video_generation_jobs_template_id ON video_generation_jobs(template_id);
CREATE INDEX IF NOT EXISTS idx_video_generation_jobs_created_at ON video_generation_jobs(created_at DESC);

-- Add RLS policies
ALTER TABLE video_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all jobs
CREATE POLICY "Admins can view all video generation jobs" ON video_generation_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

-- Allow admins to insert jobs
CREATE POLICY "Admins can insert video generation jobs" ON video_generation_jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

-- Allow admins to update jobs
CREATE POLICY "Admins can update video generation jobs" ON video_generation_jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

-- Allow users to view their own jobs (if needed in the future)
CREATE POLICY "Users can view their own video generation jobs" ON video_generation_jobs
  FOR SELECT USING (submitted_by = auth.uid()); 