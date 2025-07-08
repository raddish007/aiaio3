-- Create template_audio_scripts table
CREATE TABLE IF NOT EXISTS template_audio_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('lullaby', 'name-video', 'letter-hunt')),
  asset_purpose TEXT NOT NULL CHECK (asset_purpose IN ('intro_audio', 'outro_audio', 'background_music', 'voice_narration', 'sound_effect')),
  script TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  speed DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_audio_scripts_template_type ON template_audio_scripts(template_type);
CREATE INDEX IF NOT EXISTS idx_template_audio_scripts_asset_purpose ON template_audio_scripts(asset_purpose);
CREATE INDEX IF NOT EXISTS idx_template_audio_scripts_created_at ON template_audio_scripts(created_at);

-- Enable RLS
ALTER TABLE template_audio_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow admin users to manage template audio scripts" ON template_audio_scripts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

-- Insert some default template audio scripts
INSERT INTO template_audio_scripts (name, template_type, asset_purpose, script, voice_id, speed, description, tags) VALUES
('Lullaby Intro - Goodnight', 'lullaby', 'intro_audio', 'It''s time for bed, [NAME]! Let''s get ready for a peaceful night''s sleep.', '248nvfaZe8BXhKntjmpp', 0.8, 'Gentle introduction for lullaby videos', ARRAY['bedtime', 'calm', 'intro']),
('Lullaby Outro - Sweet Dreams', 'lullaby', 'outro_audio', 'Sweet dreams, [NAME]. Sleep well and have wonderful dreams.', '248nvfaZe8BXhKntjmpp', 0.8, 'Peaceful ending for lullaby videos', ARRAY['bedtime', 'calm', 'outro']),
('Name Video Intro - Hello', 'name-video', 'intro_audio', 'Hello [NAME]! Let''s learn about your special name today.', '248nvfaZe8BXhKntjmpp', 1.0, 'Friendly introduction for name learning videos', ARRAY['educational', 'friendly', 'intro']),
('Name Video Outro - Great Job', 'name-video', 'outro_audio', 'Great job, [NAME]! You''re learning so much about your name.', '248nvfaZe8BXhKntjmpp', 1.0, 'Encouraging ending for name learning videos', ARRAY['educational', 'encouraging', 'outro']),
('Letter Hunt Intro - Adventure', 'letter-hunt', 'intro_audio', 'Ready for an adventure, [NAME]? Let''s go on a letter hunt!', '248nvfaZe8BXhKntjmpp', 1.0, 'Exciting introduction for letter hunt videos', ARRAY['educational', 'exciting', 'intro']),
('Letter Hunt Outro - Amazing Work', 'letter-hunt', 'outro_audio', 'Amazing work, [NAME]! You found all the letters!', '248nvfaZe8BXhKntjmpp', 1.0, 'Celebratory ending for letter hunt videos', ARRAY['educational', 'celebratory', 'outro']); 