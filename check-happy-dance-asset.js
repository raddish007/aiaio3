require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHappyDanceAsset() {
  console.log('🔍 Checking happy dance asset structure...');
  
  // Check the specific asset ID provided
  const { data: asset, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', '0dddacc9-b2e1-4d87-9c36-7ffbe121f4fa')
    .single();

  if (error) {
    console.error('❌ Error fetching asset:', error);
    return;
  }

  if (!asset) {
    console.log('❌ Asset not found');
    return;
  }

  console.log('✅ Happy Dance Asset Found:');
  console.log(`  ID: ${asset.id}`);
  console.log(`  Type: ${asset.type}`);
  console.log(`  Status: ${asset.status}`);
  console.log(`  URL: ${asset.url}`);
  console.log(`  Metadata:`, JSON.stringify(asset.metadata, null, 2));

  // Look for other happy dance assets
  console.log('\n🔍 Looking for other happy dance assets...');
  
  const { data: otherAssets, error: searchError } = await supabase
    .from('assets')
    .select('*')
    .eq('metadata->>template', 'letter-hunt')
    .ilike('metadata->>assetPurpose', '%happy%');

  if (searchError) {
    console.error('❌ Error searching for happy dance assets:', searchError);
    return;
  }

  console.log(`\n📋 Found ${otherAssets?.length || 0} happy dance related assets:`);
  otherAssets?.forEach(asset => {
    console.log(`  - ${asset.id}: ${asset.type} (${asset.metadata?.assetPurpose}) - Theme: ${asset.metadata?.theme || 'none'}, Letter: ${asset.metadata?.targetLetter || 'none'}`);
  });

  // Check for happy dance audio assets
  console.log('\n🎵 Looking for happy dance audio assets...');
  
  const { data: audioAssets, error: audioError } = await supabase
    .from('assets')
    .select('*')
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'audio')
    .ilike('metadata->>assetPurpose', '%happy%');

  if (audioError) {
    console.error('❌ Error searching for happy dance audio:', audioError);
    return;
  }

  console.log(`\n🎵 Found ${audioAssets?.length || 0} happy dance audio assets:`);
  audioAssets?.forEach(asset => {
    console.log(`  - ${asset.id}: ${asset.metadata?.assetPurpose} - Letter: ${asset.metadata?.targetLetter || 'none'}`);
  });
}

checkHappyDanceAsset().catch(console.error);
