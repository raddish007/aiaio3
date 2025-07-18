require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSpecificAsset() {
  console.log('🔍 Checking Specific Asset...\n');

  try {
    // Check the most recent asset I created
    const assetId = '5abf03c7-09e4-4f9a-b476-aa26af4b8758';
    
    console.log(`Checking asset ${assetId}...`);
    
    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error) {
      console.error('❌ Error fetching asset:', error);
      return;
    }

    if (!asset) {
      console.log('❌ Asset not found');
      return;
    }

    console.log('✅ Asset found!');
    console.log('\nAsset details:');
    console.log('- ID:', asset.id);
    console.log('- Type:', asset.type);
    console.log('- Status:', asset.status);
    console.log('- URL:', asset.url);
    console.log('- File URL:', asset.file_url);
    console.log('- Project ID:', asset.project_id);
    console.log('- Template (from metadata):', asset.metadata?.template);
    console.log('- Page (from metadata):', asset.metadata?.page);
    console.log('- Asset Purpose (from metadata):', asset.metadata?.asset_purpose);
    
    console.log('\nFull metadata:');
    console.log(JSON.stringify(asset.metadata, null, 2));

  } catch (error) {
    console.error('💥 Error in check script:', error);
  }
}

// Run the check function
checkSpecificAsset().then(() => {
  console.log('\n✅ Check complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 