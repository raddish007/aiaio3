const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAndrewOutroAudio() {
  console.log('🔧 Fixing Andrew outro audio asset...');
  
  // Update the second asset to be the encouragement message
  const assetIdToUpdate = '8339a778-b7ef-49e8-a9b0-deebdb42a2ff';
  
  // First, let's check the current metadata
  const { data: currentAsset, error: fetchError } = await supabase
    .from('assets')
    .select('metadata')
    .eq('id', assetIdToUpdate)
    .single();
    
  if (fetchError) {
    console.error('❌ Error fetching asset:', fetchError);
    return;
  }
  
  console.log('📋 Current metadata:', JSON.stringify(currentAsset.metadata, null, 2));
  
  // Update the metadata to set audio_class to name_encouragement
  const updatedMetadata = {
    ...currentAsset.metadata,
    audio_class: 'name_encouragement'
  };
  
  const { data, error } = await supabase
    .from('assets')
    .update({ 
      metadata: updatedMetadata
    })
    .eq('id', assetIdToUpdate)
    .select();
    
  if (error) {
    console.error('❌ Error updating asset:', error);
  } else {
    console.log('✅ Successfully updated asset audio_class to "name_encouragement"');
    console.log('📋 New metadata:', JSON.stringify(data[0].metadata, null, 2));
  }
}

fixAndrewOutroAudio().catch(console.error);
