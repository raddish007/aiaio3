const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSpecificAsset() {
  const assetId = '1483713d-0dc0-4979-89a5-8a8ddc209b4c';
  
  console.log(`🔍 Debugging asset: ${assetId}`);
  
  // Get the specific asset
  const { data: asset, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single();
    
  if (error) {
    console.error('Error fetching asset:', error);
    return;
  }
  
  if (!asset) {
    console.log('❌ Asset not found');
    return;
  }
  
  console.log('\n📦 Asset Details:');
  console.log('ID:', asset.id);
  console.log('Type:', asset.type);
  console.log('Status:', asset.status);
  console.log('File URL:', asset.file_url);
  console.log('Created:', asset.created_at);
  console.log('Updated:', asset.updated_at);
  
  console.log('\n🏷️ Metadata:');
  console.log(JSON.stringify(asset.metadata, null, 2));
  
  // Check what the Letter Hunt UI would be looking for
  console.log('\n🎯 Letter Hunt Detection Analysis:');
  
  const template = asset.metadata?.template;
  const childName = asset.metadata?.child_name;
  const targetLetter = asset.metadata?.targetLetter;
  const assetPurpose = asset.metadata?.assetPurpose;
  const templateContextAssetPurpose = asset.metadata?.template_context?.asset_purpose;
  
  console.log('Template:', template);
  console.log('Child Name:', childName);
  console.log('Target Letter:', targetLetter);
  console.log('Asset Purpose:', assetPurpose);
  console.log('Template Context Asset Purpose:', templateContextAssetPurpose);
  
  // Simulate the Letter Hunt query
  console.log('\n🔍 Simulating Letter Hunt Query:');
  console.log('Looking for assets with:');
  console.log('- Status: approved OR pending');
  console.log('- Template: letter-hunt');
  console.log('- Child Name: (will be provided by user)');
  console.log('- Target Letter: (will be provided by user)');
  
  // Check what asset key this would map to
  let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose;
  
  if (!assetKey && asset.type === 'audio' && asset.metadata?.template_context?.asset_purpose) {
    assetKey = asset.metadata.template_context.asset_purpose;
    console.log('📁 Would use legacy fallback mapping');
  }
  
  console.log('Asset Key for mapping:', assetKey);
  
  if (assetKey === 'titleAudio') {
    console.log('✅ This asset SHOULD be detected as titleAudio');
  } else {
    console.log('❌ This asset would NOT be detected as titleAudio');
    console.log('Expected assetKey: titleAudio');
    console.log('Actual assetKey:', assetKey);
  }
  
  // Test query that Letter Hunt UI would run
  if (childName && targetLetter) {
    console.log(`\n🧪 Testing actual Letter Hunt query for ${childName}, letter ${targetLetter}:`);
    
    const { data: testAssets, error: testError } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('metadata->>child_name', childName)
      .eq('metadata->>targetLetter', targetLetter);
      
    if (testError) {
      console.error('Test query error:', testError);
    } else {
      console.log(`Found ${testAssets?.length || 0} assets in test query`);
      testAssets?.forEach((testAsset, index) => {
        console.log(`Asset ${index + 1}:`, {
          id: testAsset.id,
          type: testAsset.type,
          status: testAsset.status,
          assetPurpose: testAsset.metadata?.assetPurpose,
          imageType: testAsset.metadata?.imageType,
          templateContextAssetPurpose: testAsset.metadata?.template_context?.asset_purpose
        });
      });
    }
  }
}

debugSpecificAsset().catch(console.error);
