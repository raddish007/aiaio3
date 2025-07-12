const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1OTI3MjQsImV4cCI6MjA1MTE2ODcyNH0.QfZZ3hh-v3I7G2C-xNRdpROdSm8-rQIGOFrWLHrWAuI'
);

async function fixTitleAudioAsset() {
  try {
    console.log('🔧 Fixing Title Audio asset metadata...');
    
    // First, get the current asset
    const { data: asset, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', '906c5cd3-3816-43be-a0ee-80877f1948d8')
      .single();
    
    if (fetchError || !asset) {
      console.error('❌ Error fetching asset:', fetchError);
      return;
    }
    
    console.log('📦 Current asset metadata:');
    console.log(JSON.stringify(asset.metadata, null, 2));
    
    // Add the missing assetPurpose field
    const updatedMetadata = {
      ...asset.metadata,
      assetPurpose: 'titleAudio'
    };
    
    console.log('🔄 Updating metadata to include assetPurpose: titleAudio');
    
    // Update the asset
    const { data, error } = await supabase
      .from('assets')
      .update({ metadata: updatedMetadata })
      .eq('id', '906c5cd3-3816-43be-a0ee-80877f1948d8')
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating asset:', error);
      return;
    }
    
    console.log('✅ Successfully updated asset metadata!');
    console.log('📦 New metadata:');
    console.log(JSON.stringify(data.metadata, null, 2));
    
    console.log('🎯 Asset should now be detected as titleAudio in Letter Hunt workflow');
    
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

fixTitleAudioAsset();
