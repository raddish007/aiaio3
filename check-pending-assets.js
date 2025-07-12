require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRecentPendingAssets() {
  console.log('🔍 Checking recent pending assets...');
  
  const { data: assets, error } = await supabase
    .from('assets')
    .select('*')
    .eq('status', 'pending')
    .eq('type', 'audio')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📦 Found ${assets.length} recent pending audio assets:`);
  assets.forEach((asset, index) => {
    console.log(`\n--- Asset ${index + 1} ---`);
    console.log('🆔 ID:', asset.id);
    console.log('📅 Created:', new Date(asset.created_at).toLocaleString());
    console.log('🎯 Template:', asset.metadata?.template);
    console.log('👶 Child:', asset.metadata?.child_name);
    console.log('🔧 Asset Purpose:', asset.metadata?.assetPurpose);
    console.log('🖼️ Image Type:', asset.metadata?.imageType);
    console.log('📄 Script (first 50 chars):', asset.metadata?.script?.substring(0, 50) + '...');
  });
}

// Also check if there are Letter Hunt assets for Andrew/A
async function checkAndrewAssets() {
  console.log('\n🔍 Checking Andrew/A Letter Hunt assets specifically...');
  
  const { data: assets, error } = await supabase
    .from('assets')
    .select('*')
    .eq('metadata->>template', 'letter-hunt')
    .eq('metadata->>child_name', 'Andrew')
    .eq('metadata->>targetLetter', 'A')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`📦 Found ${assets.length} Andrew/A Letter Hunt assets:`);
  assets.forEach((asset, index) => {
    console.log(`\n--- Asset ${index + 1} ---`);
    console.log('🆔 ID:', asset.id);
    console.log('📅 Created:', new Date(asset.created_at).toLocaleString());
    console.log('✅ Status:', asset.status);
    console.log('🎵 Type:', asset.type);
    console.log('🔧 Asset Purpose:', asset.metadata?.assetPurpose);
    console.log('🖼️ Image Type:', asset.metadata?.imageType);
    console.log('📄 Script (first 50 chars):', asset.metadata?.script?.substring(0, 50) + '...');
  });
}

async function main() {
  await checkRecentPendingAssets();
  await checkAndrewAssets();
  process.exit(0);
}

main().catch(console.error);
