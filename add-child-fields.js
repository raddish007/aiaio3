const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addChildFields() {
  console.log('🔍 Checking current children table structure...');
  
  // First, check current columns
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'children');
    
  if (columnsError) {
    console.error('Error checking columns:', columnsError);
    return;
  }
  
  console.log('Current children table columns:', columns.map(c => c.column_name));
  
  const hasChildDescription = columns.some(c => c.column_name === 'child_description');
  const hasPronouns = columns.some(c => c.column_name === 'pronouns');
  const hasSidekickDescription = columns.some(c => c.column_name === 'sidekick_description');
  
  console.log('Fields status:', {
    child_description: hasChildDescription ? '✅ exists' : '❌ missing',
    pronouns: hasPronouns ? '✅ exists' : '❌ missing',
    sidekick_description: hasSidekickDescription ? '✅ exists' : '❌ missing'
  });
  
  if (hasChildDescription && hasPronouns && hasSidekickDescription) {
    console.log('✅ All fields already exist! No changes needed.');
    return;
  }
  
  console.log('🔧 Adding missing fields...');
  
  const sql = `
    -- Add missing columns
    ALTER TABLE children ADD COLUMN IF NOT EXISTS child_description TEXT;
    ALTER TABLE children ADD COLUMN IF NOT EXISTS pronouns VARCHAR(20) DEFAULT 'he/him';
    ALTER TABLE children ADD COLUMN IF NOT EXISTS sidekick_description TEXT;
    
    -- Add constraint for pronouns
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
  `;
  
  const { error: sqlError } = await supabase.rpc('exec_sql', { sql });
  
  if (sqlError) {
    console.error('❌ Error executing SQL:', sqlError);
    return;
  }
  
  console.log('✅ Successfully added child profile fields!');
  
  // Now check if we have any children to update
  const { data: children, error: childrenError } = await supabase
    .from('children')
    .select('id, name, child_description, pronouns, sidekick_description');
    
  if (childrenError) {
    console.error('Error fetching children:', childrenError);
    return;
  }
  
  console.log(`📊 Found ${children.length} children in database`);
  
  if (children.length > 0) {
    console.log('Children:', children.map(c => `${c.name} (descriptions: ${!!c.child_description}/${!!c.sidekick_description})`));
  }
}

addChildFields().catch(console.error);
