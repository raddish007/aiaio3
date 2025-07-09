-- Create template_image_scripts table
CREATE TABLE IF NOT EXISTS template_image_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('lullaby', 'name-video', 'letter-hunt')),
  asset_purpose TEXT NOT NULL,
  description TEXT,
  safe_zone TEXT NOT NULL DEFAULT 'center_safe' CHECK (safe_zone IN ('intro_safe', 'center_safe', 'outro_safe', 'all_ok', 'not_applicable')),
  default_prompt TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_image_scripts_template_type ON template_image_scripts(template_type);
CREATE INDEX IF NOT EXISTS idx_template_image_scripts_asset_purpose ON template_image_scripts(asset_purpose);
CREATE INDEX IF NOT EXISTS idx_template_image_scripts_created_at ON template_image_scripts(created_at);

-- Enable RLS
ALTER TABLE template_image_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow admin users to manage template image scripts" ON template_image_scripts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

-- Insert some default template image scripts
INSERT INTO template_image_scripts (name, template_type, asset_purpose, description, safe_zone, default_prompt, tags) VALUES
('Lullaby Intro Background', 'lullaby', 'intro_background', 'Gentle bedtime scene for video intro', 'intro_safe', 'Create a gentle, calming bedtime scene for the video intro. Soft, warm colors with peaceful bedtime elements like stars, moon, or sleeping animals. 2D Pixar style, frame composition with center area empty for title text.', ARRAY['bedtime', 'calm', 'intro']),
('Lullaby Slideshow Background', 'lullaby', 'slideshow_image', 'Peaceful scene for lullaby slideshow', 'all_ok', 'Create a peaceful bedtime scene for the lullaby slideshow. A gentle sleeping animal or character in a calm, soothing environment. 2D Pixar style, soft colors, simple composition.', ARRAY['bedtime', 'peaceful', 'slideshow']),
('Lullaby Outro Background', 'lullaby', 'outro_background', 'Dreamy ending scene for lullaby video', 'outro_safe', 'Create a peaceful ending scene for the lullaby video. Soft, dreamy atmosphere with gentle lighting and peaceful elements. 2D Pixar style, warm colors.', ARRAY['bedtime', 'dreamy', 'outro']),
('Name Video Intro Background', 'name-video', 'intro_background', 'Educational intro scene for name videos', 'intro_safe', 'Create an educational, colorful intro scene for name learning videos. Bright, engaging colors with learning elements. 2D Pixar style, child-friendly design.', ARRAY['educational', 'colorful', 'intro']),
('Letter Hunt Background', 'letter-hunt', 'scene_background', 'Alphabet learning scene background', 'all_ok', 'Create an engaging alphabet learning scene. Colorful letters and educational elements in a fun, child-friendly environment. 2D Pixar style, bright colors.', ARRAY['educational', 'alphabet', 'colorful']);

-- Add updated_at trigger
CREATE TRIGGER update_template_image_scripts_updated_at BEFORE UPDATE ON template_image_scripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 