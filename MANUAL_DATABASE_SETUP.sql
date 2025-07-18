-- SQL to add child profile fields (SAFE VERSION)
-- Run these commands in your Supabase SQL editor or database client
-- This version checks if columns already exist before adding them

-- 1. Add the new columns to the children table (only if they don't exist)
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
        ALTER TABLE children ADD COLUMN pronouns VARCHAR(20) DEFAULT 'he/him';
    END IF;
    
    -- Add sidekick_description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'children' AND column_name = 'sidekick_description') THEN
        ALTER TABLE children ADD COLUMN sidekick_description TEXT;
    END IF;
END $$;

-- 2. Add check constraint for pronouns (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'children' 
        AND constraint_name = 'children_pronouns_check'
    ) THEN
        ALTER TABLE children ADD CONSTRAINT children_pronouns_check 
        CHECK (pronouns IN ('he/him', 'she/her', 'they/them'));
    END IF;
END $$;

-- 3. Add comments to document the fields
COMMENT ON COLUMN children.child_description IS 'Text description of what the child looks like for image generation prompts (e.g., "a young boy with messy brown hair and light skin, wearing denim overalls")';
COMMENT ON COLUMN children.pronouns IS 'Pronouns to use for the child in video generation (he/him, she/her, they/them)';
COMMENT ON COLUMN children.sidekick_description IS 'Description of the child''s sidekick character for video generation (e.g., "a floppy-eared golden retriever puppy with a red collar")';

-- 4. Create index for pronouns (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'children' 
        AND indexname = 'idx_children_pronouns'
    ) THEN
        CREATE INDEX idx_children_pronouns ON children(pronouns);
    END IF;
END $$;

-- 5. Optional: Add sample data for existing children
UPDATE children 
SET child_description = CASE 
  WHEN name = 'Andrew' THEN 'a young boy with short brown hair, light skin, wearing a blue t-shirt and khaki shorts, with a bright smile'
  WHEN name = 'Lorelei' THEN 'a young girl with long blonde hair in pigtails, light skin, wearing a pink dress with sparkles, smiling cheerfully'
  WHEN name = 'Angelique' THEN 'a young girl with curly dark hair, medium skin tone, wearing a purple shirt and jeans, with an adventurous expression'
  WHEN name = 'Nolan' THEN 'a young boy with messy brown hair, light skin, wearing an orange hoodie and dark pants, with an excited expression'
  WHEN name = 'Christopher' THEN 'a young boy with short black hair, medium skin tone, wearing a green t-shirt and cargo shorts, looking curious'
  WHEN name = 'Emma' THEN 'a young girl with shoulder-length brown hair, light skin, wearing a yellow sundress and white sneakers, smiling sweetly'
  WHEN name = 'Mason' THEN 'a young boy with blonde hair, light skin, wearing a red shirt and blue jeans, with an energetic pose'
  ELSE NULL
END,
pronouns = CASE 
  WHEN name IN ('Andrew', 'Nolan', 'Christopher', 'Mason') THEN 'he/him'
  WHEN name IN ('Lorelei', 'Angelique', 'Emma') THEN 'she/her'
  ELSE 'he/him'
END,
sidekick_description = CASE 
  WHEN name = 'Andrew' THEN 'a friendly golden retriever puppy with floppy ears, a red collar, and a wagging tail'
  WHEN name = 'Lorelei' THEN 'a small purple dragon with sparkly wings, big friendly eyes, and a playful personality'
  WHEN name = 'Angelique' THEN 'a wise baby owl with large amber eyes, soft brown feathers, and a curious expression'
  WHEN name = 'Nolan' THEN 'a cheerful orange cat with white paws, green eyes, and a mischievous smile'
  WHEN name = 'Christopher' THEN 'a gentle brown bear cub with dark eyes, soft fur, and a friendly demeanor'
  WHEN name = 'Emma' THEN 'a graceful white unicorn foal with a rainbow mane, sparkly horn, and kind eyes'
  WHEN name = 'Mason' THEN 'an energetic blue parrot with bright feathers, a curved beak, and an adventurous spirit'
  ELSE NULL
END
WHERE name IN ('Andrew', 'Lorelei', 'Angelique', 'Nolan', 'Christopher', 'Emma', 'Mason');

-- 6. Verify the changes
SELECT id, name, child_description, pronouns, sidekick_description 
FROM children 
ORDER BY name;
