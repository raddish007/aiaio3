-- Simple SQL to add the columns directly
ALTER TABLE children ADD COLUMN IF NOT EXISTS child_description TEXT;
ALTER TABLE children ADD COLUMN IF NOT EXISTS pronouns VARCHAR(20) DEFAULT 'he/him';
ALTER TABLE children ADD COLUMN IF NOT EXISTS sidekick_description TEXT;

-- Add check constraint for pronouns
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
