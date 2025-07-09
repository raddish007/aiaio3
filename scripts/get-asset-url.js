const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAssetUrl(assetId) {
  try {
    console.log(`🔍 Fetching asset with ID: ${assetId}`);
    
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();
    
    if (error) {
      console.error('❌ Error fetching asset:', error);
      return;
    }
    
    if (!data) {
      console.error('❌ Asset not found');
      return;
    }
    
    console.log('✅ Asset found:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Type: ${data.type}`);
    console.log(`   Theme: ${data.theme}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   File URL: ${data.file_url}`);
    console.log(`   Safe Zone: ${data.safe_zone}`);
    console.log(`   Tags: ${data.tags?.join(', ') || 'none'}`);
    
    if (data.file_url) {
      console.log(`\n🌐 Public URL: ${data.file_url}`);
    } else {
      console.log('\n❌ No file URL found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

const assetId = process.argv[2];
if (!assetId) {
  console.error('Usage: node scripts/get-asset-url.js <asset-id>');
  process.exit(1);
}

getAssetUrl(assetId); 