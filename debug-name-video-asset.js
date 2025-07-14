const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNameVideoQuery() {
  console.log('🔍 Testing NameVideo asset detection for Andrew...');
  
  // Test the new query that should match your asset
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .or('metadata->>template.eq.namevideo,metadata->>template.eq.name-video')
    .eq('metadata->>child_name', 'Andrew');
    
  if (error) {
    console.error('❌ Query error:', error);
  } else {
    console.log('✅ Found assets:', data.length);
    data.forEach(asset => {
      const assetClass = asset.metadata?.asset_class || asset.metadata?.audio_class;
      console.log('  -', asset.id, '|', assetClass, '|', asset.metadata?.template, '|', asset.type);
    });
  }

  // Also check the specific asset ID you mentioned
  console.log('\n🎯 Checking specific asset:', '822dc3b9-3215-4077-b040-51c4a6b760bd');
  const { data: specificAsset, error: specificError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', '822dc3b9-3215-4077-b040-51c4a6b760bd')
    .single();
    
  if (specificError) {
    console.error('❌ Specific asset error:', specificError);
  } else {
    console.log('✅ Asset details:');
    console.log('  - Template:', specificAsset.metadata?.template);
    console.log('  - Child Name:', specificAsset.metadata?.child_name);
    console.log('  - Audio Class:', specificAsset.metadata?.audio_class);
    console.log('  - Asset Class:', specificAsset.metadata?.asset_class);
    console.log('  - Status:', specificAsset.status);
  }
}

testNameVideoQuery().catch(console.error);
