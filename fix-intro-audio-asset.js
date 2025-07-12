const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAssetMetadata() {
  console.log('🔧 Fixing asset metadata for 940a7c3c-7a12-4e34-8cea-1f41dc14ee5f\n');

  try {
    const assetId = '940a7c3c-7a12-4e34-8cea-1f41dc14ee5f';

    // Get current asset
    const { data: asset, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching asset:', fetchError);
      return;
    }

    console.log('📄 Current metadata:', JSON.stringify(asset.metadata, null, 2));

    // Fix the metadata
    const updatedMetadata = {
      ...asset.metadata,
      assetPurpose: 'introAudio',
      child_name: null, // Remove placeholder, make it truly generic
      personalization: 'letter-specific'
    };

    console.log('\n📝 Updated metadata:', JSON.stringify(updatedMetadata, null, 2));

    // Update the asset
    const { data: updated, error: updateError } = await supabase
      .from('assets')
      .update({ metadata: updatedMetadata })
      .eq('id', assetId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating asset:', updateError);
      return;
    }

    console.log('\n✅ Asset updated successfully!');

    // Test the queries again
    console.log('\n🧪 Re-testing queries with fixed metadata:\n');

    // Query 1: Letter-specific audio assets
    const { data: letterSpecificAudio } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio')
      .eq('metadata->>targetLetter', 'A')
      .is('metadata->>child_name', null);

    console.log('Query 1 - Letter-specific audio:');
    const foundInQuery1 = letterSpecificAudio?.find(a => a.id === assetId);
    console.log(`  Result: ${foundInQuery1 ? '✅ FOUND' : '❌ NOT FOUND'} (${letterSpecificAudio?.length || 0} total results)`);

    // Query 2: By assetPurpose
    const { data: byPurpose } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>assetPurpose', 'introAudio');

    console.log('\nQuery 2 - By assetPurpose:');
    const foundInQuery2 = byPurpose?.find(a => a.id === assetId);
    console.log(`  Result: ${foundInQuery2 ? '✅ FOUND' : '❌ NOT FOUND'} (${byPurpose?.length || 0} total results)`);

    // Test mapping
    console.log('\n🗺️  Testing asset mapping:');
    if (foundInQuery1) {
      const assetKey = foundInQuery1.metadata?.assetPurpose;
      console.log(`  Asset key: "${assetKey}"`);
      console.log(`  Maps to introAudio: ${assetKey === 'introAudio' ? '✅ YES' : '❌ NO'}`);
    }

    console.log('\n✅ Fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixAssetMetadata().catch(console.error);
