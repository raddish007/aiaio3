-- Migration: Add child profile fields for enhanced video generation
-- This migration adds new fields to the children table for consistent character representation

-- Check if columns already exist before adding them
DO $$ 
BEGIN
    -- Add child_description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'children' AND column_name = 'child_description') THEN
        ALTER TABLE children ADD COLUMN child_description TEXT;
    END IF;
    
    -- Add pronouns column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'children' AND column_name = 'pronouns') THEN
        ALTER TABLE children ADD COLUMN pronouns VARCHAR(20) DEFAULT 'he/him' 
        CHECK (pronouns IN ('he/him', 'she/her', 'they/them'));
    END IF;
    
    -- Add sidekick_description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'children' AND column_name = 'sidekick_description') THEN
        ALTER TABLE children ADD COLUMN sidekick_description TEXT;
    END IF;
END $$;

-- Add comments to document the new fields (only if they don't already exist)
DO $$
BEGIN
    -- Add comments if the columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'children' AND column_name = 'child_description') THEN
        COMMENT ON COLUMN children.child_description IS 'Text description of what the child looks like for image generation prompts (e.g., "a young boy with messy brown hair and light skin, wearing denim overalls")';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'children' AND column_name = 'pronouns') THEN
        COMMENT ON COLUMN children.pronouns IS 'Pronouns to use for the child in video generation (he/him, she/her, they/them)';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'children' AND column_name = 'sidekick_description') THEN
        COMMENT ON COLUMN children.sidekick_description IS 'Description of the child''s sidekick character for video generation (e.g., "a floppy-eared golden retriever puppy with a red collar")';
    END IF;
END $$;

-- Create index for pronouns for filtering if needed (only if column exists and index doesn't exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'children' AND column_name = 'pronouns') 
       AND NOT EXISTS (SELECT 1 FROM pg_indexes 
                       WHERE tablename = 'children' AND indexname = 'idx_children_pronouns') THEN
        CREATE INDEX idx_children_pronouns ON children(pronouns);
    END IF;
END $$;

-- Add sample data for existing children (only if data doesn't already exist)
DO $$
BEGIN
    -- Only update if child_description is null for existing children
    UPDATE children 
    SET child_description = CASE 
      WHEN name = 'Andrew' AND child_description IS NULL THEN 'a young boy with short brown hair, light skin, wearing a blue t-shirt and khaki shorts, with a bright smile'
      WHEN name = 'Lorelei' AND child_description IS NULL THEN 'a young girl with long blonde hair in pigtails, light skin, wearing a pink dress with sparkles, smiling cheerfully'
      WHEN name = 'Angelique' AND child_description IS NULL THEN 'a young girl with curly dark hair, medium skin tone, wearing a purple shirt and jeans, with an adventurous expression'
      WHEN name = 'Nolan' AND child_description IS NULL THEN 'a young boy with messy brown hair, light skin, wearing an orange hoodie and dark pants, with an excited expression'
      WHEN name = 'Christopher' AND child_description IS NULL THEN 'a young boy with short black hair, medium skin tone, wearing a green t-shirt and cargo shorts, looking curious'
      WHEN name = 'Emma' AND child_description IS NULL THEN 'a young girl with shoulder-length brown hair, light skin, wearing a yellow sundress and white sneakers, smiling sweetly'
      WHEN name = 'Mason' AND child_description IS NULL THEN 'a young boy with blonde hair, light skin, wearing a red shirt and blue jeans, with an energetic pose'
      ELSE child_description
    END,
    pronouns = CASE 
      WHEN name IN ('Andrew', 'Nolan', 'Christopher', 'Mason') AND pronouns IS NULL THEN 'he/him'
      WHEN name IN ('Lorelei', 'Angelique', 'Emma') AND pronouns IS NULL THEN 'she/her'
      WHEN pronouns IS NULL THEN 'he/him'
      ELSE pronouns
    END,
    sidekick_description = CASE 
      WHEN name = 'Andrew' AND sidekick_description IS NULL THEN 'a friendly golden retriever puppy with floppy ears, a red collar, and a wagging tail'
      WHEN name = 'Lorelei' AND sidekick_description IS NULL THEN 'a small purple dragon with sparkly wings, big friendly eyes, and a playful personality'
      WHEN name = 'Angelique' AND sidekick_description IS NULL THEN 'a wise baby owl with large amber eyes, soft brown feathers, and a curious expression'
      WHEN name = 'Nolan' AND sidekick_description IS NULL THEN 'a cheerful orange cat with white paws, green eyes, and a mischievous smile'
      WHEN name = 'Christopher' AND sidekick_description IS NULL THEN 'a gentle brown bear cub with dark eyes, soft fur, and a friendly demeanor'
      WHEN name = 'Emma' AND sidekick_description IS NULL THEN 'a graceful white unicorn foal with a rainbow mane, sparkly horn, and kind eyes'
      WHEN name = 'Mason' AND sidekick_description IS NULL THEN 'an energetic blue parrot with bright feathers, a curved beak, and an adventurous spirit'
      ELSE sidekick_description
    END
    WHERE name IN ('Andrew', 'Lorelei', 'Angelique', 'Nolan', 'Christopher', 'Emma', 'Mason')
    AND (child_description IS NULL OR pronouns IS NULL OR sidekick_description IS NULL);
END $$;
