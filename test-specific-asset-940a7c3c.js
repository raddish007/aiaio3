const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSpecificAsset() {
  console.log('🔍 Testing specific asset ID: 940a7c3c-7a12-4e34-8cea-1f41dc14ee5f\n');

  try {
    const assetId = '940a7c3c-7a12-4e34-8cea-1f41dc14ee5f';

    // 1. First, get the specific asset
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

    console.log('📄 Asset Details:');
    console.log(`  ID: ${asset.id}`);
    console.log(`  Type: ${asset.type}`);
    console.log(`  Status: ${asset.status}`);
    console.log(`  File URL: ${asset.file_url}`);
    console.log(`  Created: ${asset.created_at}`);
    console.log(`  Metadata:`, JSON.stringify(asset.metadata, null, 4));

    // 2. Test each query that should match this asset
    console.log('\n🧪 Testing Query Matches:\n');

    // Query 1: Letter-specific audio assets (the main query for intro audio)
    const { data: letterSpecificAudio } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio')
      .eq('metadata->>targetLetter', asset.metadata?.targetLetter)
      .is('metadata->>child_name', null);

    console.log('Query 1 - Letter-specific audio (main query):');
    console.log(`  Filters: status IN ['approved', 'pending'], template='letter-hunt', type='audio', targetLetter='${asset.metadata?.targetLetter}', child_name IS NULL`);
    const foundInQuery1 = letterSpecificAudio?.find(a => a.id === assetId);
    console.log(`  Result: ${foundInQuery1 ? '✅ FOUND' : '❌ NOT FOUND'} (${letterSpecificAudio?.length || 0} total results)`);

    // Query 2: By assetPurpose
    const { data: byPurpose } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>assetPurpose', asset.metadata?.assetPurpose);

    console.log('\nQuery 2 - By assetPurpose:');
    console.log(`  Filters: status IN ['approved', 'pending'], assetPurpose='${asset.metadata?.assetPurpose}'`);
    const foundInQuery2 = byPurpose?.find(a => a.id === assetId);
    console.log(`  Result: ${foundInQuery2 ? '✅ FOUND' : '❌ NOT FOUND'} (${byPurpose?.length || 0} total results)`);

    // Query 3: All letter hunt audio
    const { data: allLetterHuntAudio } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio');

    console.log('\nQuery 3 - All letter hunt audio:');
    console.log(`  Filters: status IN ['approved', 'pending'], template='letter-hunt', type='audio'`);
    const foundInQuery3 = allLetterHuntAudio?.find(a => a.id === assetId);
    console.log(`  Result: ${foundInQuery3 ? '✅ FOUND' : '❌ NOT FOUND'} (${allLetterHuntAudio?.length || 0} total results)`);

    // 3. Test asset mapping logic
    console.log('\n🗺️  Testing Asset Mapping Logic:\n');

    const assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
    console.log(`Asset Key (imageType || assetPurpose || videoType): "${assetKey}"`);

    // Test the specific mapping for intro audio
    if (asset.metadata?.assetPurpose === 'introAudio') {
      console.log('✅ Asset should map to "introAudio" key');
    } else {
      console.log(`❌ Asset purpose "${asset.metadata?.assetPurpose}" doesn't match "introAudio"`);
    }

    // 4. Test with a simulated Letter Hunt request
    console.log('\n🎯 Simulating Letter Hunt UI Logic:\n');

    const testChild = 'TestChild';
    const testLetter = asset.metadata?.targetLetter || 'A';

    // Replicate the exact UI queries
    const { data: specificAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('metadata->>child_name', testChild)
      .eq('metadata->>targetLetter', testLetter);

    const { data: letterSpecificAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'video')
      .eq('metadata->>targetLetter', testLetter);

    const { data: letterSpecificAudioAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio')
      .eq('metadata->>targetLetter', testLetter)
      .is('metadata->>child_name', null);

    const { data: genericVideoAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'video')
      .is('metadata->>child_name', null)
      .is('metadata->>targetLetter', null);

    const existingAssets = [
      ...(specificAssets || []),
      ...(letterSpecificAssets || []),
      ...(letterSpecificAudioAssets || []),
      ...(genericVideoAssets || [])
    ];

    console.log('UI Query Results:');
    console.log(`  Specific assets (child + letter): ${specificAssets?.length || 0}`);
    console.log(`  Letter-specific video: ${letterSpecificAssets?.length || 0}`);
    console.log(`  Letter-specific audio: ${letterSpecificAudioAssets?.length || 0}`);
    console.log(`  Generic video: ${genericVideoAssets?.length || 0}`);
    console.log(`  Total combined: ${existingAssets.length}`);

    const foundInCombined = existingAssets.find(a => a.id === assetId);
    console.log(`\nOur asset in combined results: ${foundInCombined ? '✅ FOUND' : '❌ NOT FOUND'}`);

    // 5. Test the mapping logic
    const existingByType = new Map();
    existingAssets.forEach(asset => {
      let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
      
      if (assetKey) {
        existingByType.set(assetKey, {
          url: asset.file_url,
          status: 'ready',
          assetId: asset.id,
          generatedAt: asset.created_at,
          metadata: asset.metadata
        });
      }
    });

    console.log('\n📝 Final Asset Mapping:');
    console.log(`Assets mapped: ${existingByType.size}`);
    
    if (asset.metadata?.assetPurpose) {
      const mappedAsset = existingByType.get(asset.metadata.assetPurpose);
      if (mappedAsset && mappedAsset.assetId === assetId) {
        console.log(`✅ Our asset is mapped under key "${asset.metadata.assetPurpose}"`);
      } else if (mappedAsset) {
        console.log(`❌ Key "${asset.metadata.assetPurpose}" is mapped to different asset: ${mappedAsset.assetId}`);
      } else {
        console.log(`❌ Key "${asset.metadata.assetPurpose}" is not in the mapping`);
      }
    }

    // List all mapped keys
    console.log('\nAll mapped keys:');
    for (const [key, mappedAsset] of existingByType.entries()) {
      console.log(`  ${key}: ${mappedAsset.assetId}`);
    }

    console.log('\n✅ Specific asset test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSpecificAsset().catch(console.error);
