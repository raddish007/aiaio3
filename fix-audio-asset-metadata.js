require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAudioAssetMetadata() {
  console.log('🔧 Fixing Letter Hunt audio asset metadata...\n');
  
  const audioAssets = [
    {
      id: '8ece91d1-aa24-4692-ab93-689ecd52275d',
      assetPurpose: 'signAudio',
      script: 'On signs',
      description: 'On signs'
    },
    {
      id: '26d5aea8-dbe3-4697-bbda-ac06b7c7868a', 
      assetPurpose: 'bookAudio',
      script: 'On books',
      description: 'On books'
    },
    {
      id: 'd189dd06-1e78-4cb5-a287-fdf7c3aa5d64',
      assetPurpose: 'groceryAudio', 
      script: 'Even in the grocery store!',
      description: 'Even in the grocery store!'
    }
  ];

  try {
    for (const asset of audioAssets) {
      console.log(`🎵 Updating asset ${asset.id} (${asset.assetPurpose})...`);
      
      // First, get the current asset to see its current metadata
      const { data: currentAsset, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', asset.id)
        .single();

      if (fetchError) {
        console.error(`❌ Error fetching asset ${asset.id}:`, fetchError);
        continue;
      }

      if (!currentAsset) {
        console.error(`❌ Asset ${asset.id} not found`);
        continue;
      }

      console.log(`   Current metadata:`, JSON.stringify(currentAsset.metadata, null, 2));

      // Update the metadata with the correct assetPurpose and other fields
      const updatedMetadata = {
        ...currentAsset.metadata,
        assetPurpose: asset.assetPurpose,
        script: asset.script,
        description: asset.description,
        template: 'letter-hunt',
        child_name: '', // Make it general, not child-specific
        targetLetter: null, // These are general audio, not letter-specific
        type: 'audio'
      };

      const { data, error } = await supabase
        .from('assets')
        .update({
          metadata: updatedMetadata
        })
        .eq('id', asset.id)
        .select();

      if (error) {
        console.error(`❌ Error updating asset ${asset.id}:`, error);
      } else {
        console.log(`✅ Successfully updated ${asset.assetPurpose}:`);
        console.log(`   Asset ID: ${asset.id}`);
        console.log(`   Script: "${asset.script}"`);
        console.log(`   Asset Purpose: ${asset.assetPurpose}`);
        console.log(`   Status: ${currentAsset.status}`);
        console.log('');
      }
    }

    // Verify the updates worked by querying again
    console.log('🔍 Verifying updates...\n');
    
    for (const asset of audioAssets) {
      const { data: verifyAsset, error: verifyError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', asset.id)
        .single();

      if (verifyError) {
        console.error(`❌ Error verifying asset ${asset.id}:`, verifyError);
      } else {
        console.log(`✅ ${asset.assetPurpose} verification:`);
        console.log(`   Asset Purpose: ${verifyAsset.metadata?.assetPurpose}`);
        console.log(`   Script: "${verifyAsset.metadata?.script}"`);
        console.log(`   Template: ${verifyAsset.metadata?.template}`);
        console.log(`   Child Name: "${verifyAsset.metadata?.child_name}"`);
        console.log(`   Status: ${verifyAsset.status}`);
        console.log('');
      }
    }

    console.log('🎉 All audio assets updated! They should now be detected by Letter Hunt.');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixAudioAssetMetadata();
