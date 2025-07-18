require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAssetsSchema() {
  console.log('🔍 Checking assets table schema...');
  
  // Check assets table structure
  const { data: assets, error: assetError } = await supabaseAdmin
    .from('assets')
    .select('*')
    .limit(1);

  if (assetError) {
    console.error('❌ Error fetching assets:', assetError);
  } else if (assets.length > 0) {
    console.log('✅ assets table columns:', Object.keys(assets[0]));
  } else {
    // Try to get table info by attempting an insert
    console.log('No records in assets, trying insert test...');
    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert({
        // Let's try some common column names
        name: 'test',
        type: 'test', 
        url: 'test',
        status: 'test'
      })
      .select();
    
    if (error) {
      console.error('Insert test error (helps identify column names):', error);
    } else {
      console.log('Insert successful, columns:', Object.keys(data[0]));
      
      // Clean up test record
      await supabaseAdmin
        .from('assets')
        .delete()
        .eq('id', data[0].id);
    }
  }
}

checkAssetsSchema().catch(console.error);
