const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to children table...');
    
    // Add icon column if it doesn't exist
    const { error: iconError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'children' AND column_name = 'icon'
          ) THEN
            ALTER TABLE children ADD COLUMN icon VARCHAR(255);
          END IF;
        END $$;
      `
    });
    
    if (iconError) {
      console.log('Icon column might already exist or error:', iconError.message);
    } else {
      console.log('✅ Icon column added successfully');
    }

    // Add additional_themes column if it doesn't exist
    const { error: themesError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'children' AND column_name = 'additional_themes'
          ) THEN
            ALTER TABLE children ADD COLUMN additional_themes TEXT;
          END IF;
        END $$;
      `
    });
    
    if (themesError) {
      console.log('Additional themes column might already exist or error:', themesError.message);
    } else {
      console.log('✅ Additional themes column added successfully');
    }

    // Check current table structure
    const { data: columns, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'children' 
        ORDER BY ordinal_position;
      `
    });

    if (checkError) {
      console.log('Could not check table structure:', checkError.message);
    } else {
      console.log('\n📋 Current children table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addMissingColumns(); 