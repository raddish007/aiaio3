const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addChildFields() {
  console.log('🔧 Adding child profile fields...');
  
  try {
    // Check if children table exists and what columns it has
    const { data: existingChildren, error: checkError } = await supabase
      .from('children')
      .select('*')
      .limit(1);
      
    if (checkError) {
      console.error('Error checking children table:', checkError);
      return;
    }
    
    console.log('✅ Children table exists');
    
    if (existingChildren.length > 0) {
      const firstChild = existingChildren[0];
      console.log('Current child record structure:', Object.keys(firstChild));
      
      const hasChildDescription = 'child_description' in firstChild;
      const hasPronouns = 'pronouns' in firstChild;
      const hasSidekickDescription = 'sidekick_description' in firstChild;
      
      console.log('Fields status:', {
        child_description: hasChildDescription ? '✅ exists' : '❌ missing',
        pronouns: hasPronouns ? '✅ exists' : '❌ missing',
        sidekick_description: hasSidekickDescription ? '✅ exists' : '❌ missing'
      });
      
      if (hasChildDescription && hasPronouns && hasSidekickDescription) {
        console.log('✅ All fields already exist! No changes needed.');
        return;
      }
    }
    
    // Try to add the fields using raw SQL through a simple function call
    const sqlCommands = [
      "ALTER TABLE children ADD COLUMN IF NOT EXISTS child_description TEXT",
      "ALTER TABLE children ADD COLUMN IF NOT EXISTS pronouns VARCHAR(20) DEFAULT 'he/him'",
      "ALTER TABLE children ADD COLUMN IF NOT EXISTS sidekick_description TEXT"
    ];
    
    for (const sql of sqlCommands) {
      console.log(`Executing: ${sql}`);
      try {
        // Use the raw SQL execution through edge functions or direct call
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({ query: sql })
        });
        
        if (!response.ok) {
          console.log(`⚠️  Command may have failed (${response.status}), but continuing...`);
        } else {
          console.log('✅ Command executed');
        }
      } catch (error) {
        console.log(`⚠️  Error with command, but continuing:`, error.message);
      }
    }
    
    console.log('🎉 Attempted to add all fields. Let\'s verify...');
    
    // Verify by trying to select the new fields
    const { data: updatedChildren, error: verifyError } = await supabase
      .from('children')
      .select('id, name, child_description, pronouns, sidekick_description')
      .limit(1);
      
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      console.log('You may need to add the fields manually using SQL.');
    } else {
      console.log('✅ Verification successful! Fields are available.');
      if (updatedChildren.length > 0) {
        console.log('Sample record structure:', Object.keys(updatedChildren[0]));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addChildFields().catch(console.error);
