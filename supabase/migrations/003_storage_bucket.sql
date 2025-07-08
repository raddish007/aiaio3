-- Create storage bucket for assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Add tags column to assets table if it doesn't exist
ALTER TABLE assets ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Update RLS policies for assets table to include tags
DROP POLICY IF EXISTS "Admins can view all assets" ON assets;
DROP POLICY IF EXISTS "Admins can insert assets" ON assets;
DROP POLICY IF EXISTS "Admins can update assets" ON assets;

CREATE POLICY "Admins can view all assets" ON assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

CREATE POLICY "Admins can insert assets" ON assets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

CREATE POLICY "Admins can update assets" ON assets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
        )
    );

-- Storage policies for assets bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'assets');
CREATE POLICY "Authenticated users can upload assets" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'assets' AND auth.role() = 'authenticated'
);
CREATE POLICY "Authenticated users can update assets" ON storage.objects FOR UPDATE USING (
    bucket_id = 'assets' AND auth.role() = 'authenticated'
);
CREATE POLICY "Authenticated users can delete assets" ON storage.objects FOR DELETE USING (
    bucket_id = 'assets' AND auth.role() = 'authenticated'
); 