require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEndingAssets() {
  console.log('🔍 Checking ending assets...');
  
  // Look for ending-related assets
  const { data: endingAssets, error } = await supabase
    .from('assets')
    .select('*')
    .eq('metadata->>template', 'letter-hunt')
    .or('metadata->>assetPurpose.ilike.%ending%,metadata->>imageType.ilike.%ending%,metadata->>section.ilike.%ending%');

  if (error) {
    console.error('❌ Error fetching ending assets:', error);
    return;
  }

  console.log(`\n📋 Found ${endingAssets?.length || 0} ending-related assets:`);
  endingAssets?.forEach(asset => {
    console.log(`  - ${asset.id}: ${asset.type} (${asset.metadata?.assetPurpose || asset.metadata?.imageType || asset.metadata?.section || 'no purpose'})`);
    console.log(`    Status: ${asset.status}`);
    console.log(`    Metadata:`, JSON.stringify(asset.metadata, null, 2));
  });

  // Also check what ending assets should exist based on the UI
  console.log('\n🎯 Expected ending assets:');
  console.log('  - endingImage: Child-specific ending image');
  console.log('  - endingAudio: Letter-specific ending audio saying "Have fun finding the letter A, Andrew!"');

  // Test the detection logic
  const childName = 'Andrew';
  const targetLetter = 'A';
  
  console.log('\n🔍 Testing ending asset detection for Andrew/Letter A:');
  
  // Check if any assets would be detected as ending assets
  const { data: allAssets } = await supabase
    .from('assets')
    .select('*')
    .eq('metadata->>template', 'letter-hunt');

  const mockExistingByType = new Map();
  
  allAssets?.forEach(asset => {
    let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
    
    if (assetKey === 'endingImage' || assetKey === 'endingAudio') {
      console.log(`  Found ${assetKey}: ${asset.id} (${asset.status})`);
      mockExistingByType.set(assetKey, asset);
    }
  });

  console.log(`\n📊 Detection Results:`);
  console.log(`  endingImage: ${mockExistingByType.has('endingImage') ? 'FOUND' : 'MISSING'}`);
  console.log(`  endingAudio: ${mockExistingByType.has('endingAudio') ? 'FOUND' : 'MISSING'}`);
}

checkEndingAssets().catch(console.error);
