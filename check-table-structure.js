const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  try {
    console.log('🔍 Checking table structure...');
    
    // Check child_approved_videos structure
    const { data, error } = await supabase
      .from('child_approved_videos')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data.length > 0) {
      console.log('📊 child_approved_videos table columns:');
      console.log(Object.keys(data[0]));
      console.log('\n📄 Sample record:');
      console.log(data[0]);
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkTableStructure();
