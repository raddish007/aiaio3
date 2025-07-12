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

    // 1. First, get the asset directly by ID
    const { data: directAsset, error: directError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (directError) {
      console.error('❌ Error fetching asset directly:', directError);
      return;
    }

    if (!directAsset) {
      console.log('❌ Asset not found');
      return;
    }

    console.log('✅ Asset found directly:');
    console.log(`   ID: ${directAsset.id}`);
    console.log(`   Type: ${directAsset.type}`);
    console.log(`   Status: ${directAsset.status}`);
    console.log(`   Template: ${directAsset.metadata?.template}`);
    console.log(`   Target Letter: ${directAsset.metadata?.targetLetter}`);
    console.log(`   Child Name: ${directAsset.metadata?.child_name || 'null'}`);
    console.log(`   Asset Purpose: ${directAsset.metadata?.assetPurpose}`);
    console.log(`   Voice: ${directAsset.metadata?.voice}`);
    console.log(`   Full metadata:`, JSON.stringify(directAsset.metadata, null, 2));

    // 2. Test our letter-specific audio query
    const targetLetter = directAsset.metadata?.targetLetter;
    if (targetLetter) {
      console.log(`\n🎯 Testing letter-specific audio query for letter "${targetLetter}":`);
      
      const { data: letterSpecificAudioAssets, error: queryError } = await supabase
        .from('assets')
        .select('*')
        .in('status', ['approved', 'pending'])
        .eq('metadata->>template', 'letter-hunt')
        .eq('type', 'audio')
        .eq('metadata->>targetLetter', targetLetter)
        .is('metadata->>child_name', null);

      if (queryError) {
        console.error('❌ Query error:', queryError);
      } else {
        console.log(`   Found ${letterSpecificAudioAssets?.length || 0} letter-specific audio assets`);
        
        if (letterSpecificAudioAssets?.length > 0) {
          letterSpecificAudioAssets.forEach((asset, index) => {
            const isOurAsset = asset.id === assetId;
            console.log(`   ${index + 1}. ${isOurAsset ? '🎯' : '  '} ID: ${asset.id}`);
            console.log(`      Status: ${asset.status}`);
            console.log(`      Asset Purpose: ${asset.metadata?.assetPurpose}`);
            console.log(`      Voice: ${asset.metadata?.voice}`);
            console.log(`      Child Name: ${asset.metadata?.child_name || 'null'}`);
          });
        }

        // Check if our specific asset is in the results
        const foundInQuery = letterSpecificAudioAssets?.some(asset => asset.id === assetId);
        console.log(`   Our asset in results: ${foundInQuery ? '✅ YES' : '❌ NO'}`);
      }
    }

    // 3. Test the UI mapping logic
    console.log(`\n🖥️ Testing UI mapping logic:`);
    
    const assetKey = directAsset.metadata?.assetPurpose;
    console.log(`   Asset key from assetPurpose: "${assetKey}"`);
    
    if (assetKey === 'introAudio') {
      console.log('   ✅ Asset should map to introAudio slot');
      
      // Test if it would be detected in the UI
      const existingByType = new Map();
      existingByType.set(assetKey, {
        url: directAsset.file_url,
        status: 'ready',
        assetId: directAsset.id,
        generatedAt: directAsset.created_at,
        metadata: directAsset.metadata
      });
      
      const introAudioAsset = existingByType.get('introAudio');
      console.log('   Mapped asset:', introAudioAsset);
    } else {
      console.log('   ❌ Asset would not map to introAudio slot');
    }

    // 4. Test all possible query combinations that might catch this asset
    console.log(`\n🔍 Testing all query variations:`);
    
    const queries = [
      {
        name: 'By template + type + status',
        query: supabase
          .from('assets')
          .select('*')
          .in('status', ['approved', 'pending'])
          .eq('metadata->>template', 'letter-hunt')
          .eq('type', 'audio')
      },
      {
        name: 'By template + type + assetPurpose',
        query: supabase
          .from('assets')
          .select('*')
          .eq('metadata->>template', 'letter-hunt')
          .eq('type', 'audio')
          .eq('metadata->>assetPurpose', 'introAudio')
      },
      {
        name: 'By template + targetLetter + no child_name',
        query: supabase
          .from('assets')
          .select('*')
          .eq('metadata->>template', 'letter-hunt')
          .eq('metadata->>targetLetter', targetLetter)
          .is('metadata->>child_name', null)
      }
    ];

    for (const { name, query } of queries) {
      const { data: results, error } = await query;
      if (error) {
        console.log(`   ❌ ${name}: Error - ${error.message}`);
      } else {
        const foundOurAsset = results?.some(asset => asset.id === assetId);
        console.log(`   ${foundOurAsset ? '✅' : '❌'} ${name}: ${results?.length || 0} results ${foundOurAsset ? '(includes our asset)' : ''}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSpecificAsset().catch(console.error);
