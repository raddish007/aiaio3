require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLetterHuntUI() {
  try {
    console.log('🔍 Testing Letter Hunt UI asset detection...');

    const childName = 'Andrew';
    const targetLetter = 'A';

    console.log(`\n📋 Testing for child: ${childName}, letter: ${targetLetter}`);

    // Simulate the exact query from the Letter Hunt UI
    const { data: existingAssets, error } = await supabase
      .from('assets')
      .select('id, type, status, file_url, created_at, metadata')
      .eq('metadata->>template', 'letter-hunt')
      .eq('metadata->>child_name', childName)
      .eq('metadata->>targetLetter', targetLetter)
      .in('status', ['approved', 'pending'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Query error:', error);
      return;
    }

    console.log(`\n📦 Found ${existingAssets?.length || 0} assets:`);

    // Simulate the mapping logic from the UI
    const existingByType = new Map();
    existingAssets?.forEach(asset => {
      // For images, use imageType; for audio, use assetPurpose
      let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose;
      
      // FALLBACK: For legacy audio assets without assetPurpose, try to infer from template_context
      if (!assetKey && asset.type === 'audio' && asset.metadata?.template_context?.asset_purpose) {
        assetKey = asset.metadata.template_context.asset_purpose;
        console.log(`🔄 Legacy asset: Using template_context.asset_purpose: ${assetKey} for asset ${asset.id}`);
      }
      
      if (assetKey) {
        existingByType.set(assetKey, {
          url: asset.file_url,
          status: 'ready',
          assetId: asset.id,
          generatedAt: asset.created_at
        });
        console.log(`✅ Mapped asset: ${assetKey} (${asset.type}) -> ${asset.id}`);
      } else {
        console.log(`⚠️ Asset missing key field:`, {
          id: asset.id,
          type: asset.type,
          imageType: asset.metadata?.imageType,
          assetPurpose: asset.metadata?.assetPurpose,
          templateContextAssetPurpose: asset.metadata?.template_context?.asset_purpose
        });
      }
    });

    console.log('\n🎯 Asset mapping results:');
    console.log('   titleCard:', existingByType.get('titleCard') ? `✅ Ready (${existingByType.get('titleCard').assetId})` : '❌ Missing');
    console.log('   titleAudio:', existingByType.get('titleAudio') ? `✅ Ready (${existingByType.get('titleAudio').assetId})` : '❌ Missing');

    // Check if the specific asset we fixed is there
    const titleAudioAsset = existingByType.get('titleAudio');
    if (titleAudioAsset && titleAudioAsset.assetId === '1483713d-0dc0-4979-89a5-8a8ddc209b4c') {
      console.log('\n🎉 SUCCESS: The fixed asset is now correctly detected as titleAudio!');
    } else {
      console.log('\n❌ ISSUE: The fixed asset is still not being detected correctly.');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testLetterHuntUI();
