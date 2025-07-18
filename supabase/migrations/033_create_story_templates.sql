-- Migration: Create story templates table and related structures
-- This migration creates the infrastructure for story-based video templates

-- Create story_template_type enum
CREATE TYPE story_template_type AS ENUM ('wish_button', 'adventure', 'friendship', 'custom');

-- Create story_templates table
CREATE TABLE IF NOT EXISTS story_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type story_template_type NOT NULL,
  story_structure JSONB NOT NULL, -- Stores the story structure with pages and variables
  illustration_style JSONB NOT NULL, -- Stores the consistent illustration style
  layout_format JSONB NOT NULL, -- Stores the layout requirements
  main_character JSONB NOT NULL, -- Stores the main character description
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Create story_instances table for specific child stories
CREATE TABLE IF NOT EXISTS story_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES story_templates(id),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_video_url VARCHAR(500),
  story_variables JSONB NOT NULL, -- Stores the populated story variables
  generated_assets JSONB DEFAULT '[]', -- Stores the generated asset IDs
  metadata JSONB DEFAULT '{}',
  UNIQUE(template_id, child_id)
);

-- Create story_asset_assignments table
CREATE TABLE IF NOT EXISTS story_asset_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_instance_id UUID NOT NULL REFERENCES story_instances(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL, -- 1-9 for 9-page stories
  asset_purpose VARCHAR(255) NOT NULL, -- e.g., 'title_page_image', 'desire_page_audio'
  assigned_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  UNIQUE(story_instance_id, page_number, asset_purpose)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_story_templates_type ON story_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_story_templates_created_at ON story_templates(created_at);
CREATE INDEX IF NOT EXISTS idx_story_instances_child_id ON story_instances(child_id);
CREATE INDEX IF NOT EXISTS idx_story_instances_status ON story_instances(status);
CREATE INDEX IF NOT EXISTS idx_story_asset_assignments_story_instance ON story_asset_assignments(story_instance_id);
CREATE INDEX IF NOT EXISTS idx_story_asset_assignments_page ON story_asset_assignments(page_number);

-- Enable RLS
ALTER TABLE story_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_asset_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Allow admin users to manage story templates" ON story_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

CREATE POLICY "Allow admin users to manage story instances" ON story_instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

CREATE POLICY "Allow admin users to manage story asset assignments" ON story_asset_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('content_manager', 'asset_creator', 'video_ops')
    )
  );

-- Insert default Wish Button story template
INSERT INTO story_templates (name, description, template_type, story_structure, illustration_style, layout_format, main_character, created_by) VALUES (
  'The Wish Button',
  'A 9-page preschool story about a child who discovers a magical button and learns about moderation',
  'wish_button',
  '{
    "pages": [
      {
        "number": 1,
        "name": "Title Page",
        "text_template": "{ChildName} and the Wish Button",
        "image_prompt_template": "storybook title in playful hand-drawn lettering on the right half of the image, on the left is {main_character} standing in a sunny field waving hello, with {sidekick} by his feet"
      },
      {
        "number": 2,
        "name": "Character Trait / Desire",
        "text_template": "{ChildName} loved {wish_result_items}. Not just a little—a lot. More {related_items}, more {related_items_2}, more everything!",
        "image_prompt_template": "{main_character}, excitedly talking about how much he loves {wish_result_items}, imagining more of them, in a cheerful environment like a playroom or sunny field"
      },
      {
        "number": 3,
        "name": "Discovery of the Wish Button",
        "text_template": "One day, {ChildName} found a shiny button in the {button_location}. It said: ''PRESS FOR MORE {wish_result_items_uppercase}.''",
        "image_prompt_template": "{main_character}, discovering a {magic_button} in the {button_location}, looking surprised and curious"
      },
      {
        "number": 4,
        "name": "First Wish Granted",
        "text_template": "{ChildName} pressed the button. POOF! A {wish_result_item} appeared. Then another! And another!",
        "image_prompt_template": "{main_character}, smiling and pressing the {magic_button}, as the first {wish_result_items} magically appear around him, with {sidekick} joining in"
      },
      {
        "number": 5,
        "name": "It Gets Worse",
        "text_template": "But soon, the {wish_result_items} started to {chaotic_actions}. There were {too_many}! It was too much.",
        "image_prompt_template": "{main_character}, looking overwhelmed as the {wish_result_items} {chaotic_actions}, with {sidekick} caught in the chaos, in a messy indoor setting"
      },
      {
        "number": 6,
        "name": "The Realization",
        "text_template": "{ChildName} looked around. He had everything he wished for. But he felt {realization_emotion}. He missed {missed_simple_thing}.",
        "image_prompt_template": "{main_character}, sitting alone in the middle of the messy room filled with {wish_result_items}, looking {realization_emotion}, thinking about how he misses {missed_simple_thing}"
      },
      {
        "number": 7,
        "name": "Final Wish",
        "text_template": "So he pressed the button one last time. ''I wish things could go back to how they were,'' he whispered.",
        "image_prompt_template": "{main_character}, pressing the {magic_button} one last time, whispering his wish, as the room begins to glow and change"
      },
      {
        "number": 8,
        "name": "Outcome",
        "text_template": "Now {ChildName} had what he really wanted: just enough. Just right.",
        "image_prompt_template": "{main_character}, peacefully sitting with {sidekick} in the {final_scene}, calm and smiling, with the room quiet and tidy"
      },
      {
        "number": 9,
        "name": "The End",
        "text_template": "The End.",
        "image_prompt_template": "{main_character} and {sidekick} waving goodbye together, sitting under a tree or on a hill at sunset, ''The End'' written on the right side in soft lettering"
      }
    ],
    "variables": [
      "sidekick",
      "magic_button", 
      "button_location",
      "wish_result_items",
      "chaotic_actions",
      "realization_emotion",
      "missed_simple_thing",
      "final_scene"
    ]
  }',
  '{
    "style": "children''s book illustration in a soft digital painting style, warm pastel color palette, watercolor texture, clean line art, gentle shadows, flat lighting"
  }',
  '{
    "format": "composition anchored to the left side of the image, right half of the image is intentionally empty with a soft, uncluttered pastel background for overlaying text, 16:9 horizontal layout"
  }',
  '{
    "description": "a young boy with messy brown hair, wearing denim overalls and a striped yellow shirt, around 5 years old, friendly expression, barefoot"
  }',
  NULL
);

-- Add comments to explain the structure
COMMENT ON TABLE story_templates IS 'Story templates with structured narrative and illustration requirements';
COMMENT ON COLUMN story_templates.story_structure IS 'JSON object containing pages array with text templates and image prompt templates, plus required variables';
COMMENT ON COLUMN story_templates.illustration_style IS 'JSON object containing consistent illustration style requirements';
COMMENT ON COLUMN story_templates.layout_format IS 'JSON object containing layout and composition requirements';
COMMENT ON COLUMN story_templates.main_character IS 'JSON object containing main character description';

COMMENT ON TABLE story_instances IS 'Specific story instances for individual children';
COMMENT ON COLUMN story_instances.story_variables IS 'JSON object containing populated story variables for this instance';
COMMENT ON COLUMN story_instances.generated_assets IS 'JSON array of generated asset IDs for this story';

COMMENT ON TABLE story_asset_assignments IS 'Asset assignments for specific pages in story instances';
COMMENT ON COLUMN story_asset_assignments.page_number IS 'Page number (1-9 for 9-page stories)';
COMMENT ON COLUMN story_asset_assignments.asset_purpose IS 'Purpose of the asset (e.g., title_page_image, desire_page_audio)'; 