const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1OTI3MjQsImV4cCI6MjA1MTE2ODcyNH0.QfZZ3hh-v3I7G2C-xNRdpROdSm8-rQIGOFrWLHrWAuI'
);

async function fixAssetMetadata() {
  console.log('🔧 Permanently fixing Title Audio asset metadata...');
  
  try {
    // Get the current asset
    const { data: asset, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', '906c5cd3-3816-43be-a0ee-80877f1948d8')
      .single();
    
    if (fetchError || !asset) {
      console.error('❌ Error fetching asset:', fetchError);
      return;
    }
    
    console.log('📦 Current metadata:', JSON.stringify(asset.metadata, null, 2));
    
    // Add the missing assetPurpose field
    const updatedMetadata = {
      ...asset.metadata,
      assetPurpose: 'titleAudio'
    };
    
    console.log('🔄 Updating metadata with assetPurpose: titleAudio');
    
    // Update the asset
    const { data: updatedAsset, error: updateError } = await supabase
      .from('assets')
      .update({ metadata: updatedMetadata })
      .eq('id', '906c5cd3-3816-43be-a0ee-80877f1948d8')
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating asset:', updateError);
      return;
    }
    
    console.log('✅ Successfully updated asset metadata!');
    console.log('📦 New metadata:', JSON.stringify(updatedAsset.metadata, null, 2));
    
    // Verify the asset now has the assetPurpose field
    if (updatedAsset.metadata.assetPurpose === 'titleAudio') {
      console.log('🎯 ✅ Verification: Asset now has assetPurpose: titleAudio');
      console.log('🎯 This asset will now be automatically detected by the Letter Hunt workflow!');
    } else {
      console.log('❌ Verification failed: assetPurpose not set correctly');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the fix
fixAssetMetadata()
  .then(() => {
    console.log('🏁 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
