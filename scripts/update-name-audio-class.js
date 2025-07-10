require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateNameAudioClass() {
  console.log('🔧 Updating name audio assets to have correct audio_class...\n');

  try {
    // Find all audio assets that are personalized name pronunciations
    const { data: nameAudioAssets, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'audio')
      .eq('metadata->>template', 'name-video')
      .eq('metadata->>personalization', 'personalized')
      .not('metadata->>child_name', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching name audio assets:', fetchError.message);
      return;
    }

    console.log(`📋 Found ${nameAudioAssets?.length || 0} name audio assets to update:`);
    
    if (!nameAudioAssets || nameAudioAssets.length === 0) {
      console.log('No name audio assets found. Let me search more broadly...');
      
      // Search for any audio assets with child names
      const { data: allAudioAssets, error: broadError } = await supabase
        .from('assets')
        .select('*')
        .eq('type', 'audio')
        .not('metadata->>child_name', 'is', null);

      if (broadError) {
        console.error('❌ Error in broad search:', broadError.message);
        return;
      }

      console.log(`Found ${allAudioAssets?.length || 0} audio assets with child names:`);
      
      if (allAudioAssets && allAudioAssets.length > 0) {
        allAudioAssets.forEach(asset => {
          console.log(`  - ${asset.id}: ${asset.metadata?.child_name} (template: ${asset.metadata?.template}, audio_class: ${asset.metadata?.audio_class || 'NOT SET'})`);
        });
      }
      
      return;
    }

    // Update each asset to have the correct audio_class
    for (const asset of nameAudioAssets) {
      console.log(`\n📝 Updating asset: ${asset.id}`);
      console.log(`   Child Name: ${asset.metadata?.child_name}`);
      console.log(`   Current audio_class: ${asset.metadata?.audio_class || 'NOT SET'}`);
      
      const { data: updatedAsset, error: updateError } = await supabase
        .from('assets')
        .update({
          metadata: {
            ...asset.metadata,
            audio_class: 'name_audio'
          }
        })
        .eq('id', asset.id)
        .select()
        .single();

      if (updateError) {
        console.error(`❌ Error updating asset ${asset.id}:`, updateError.message);
      } else {
        console.log(`✅ Updated asset ${asset.id} - audio_class: ${updatedAsset.metadata?.audio_class}`);
      }
    }

    console.log('\n🎉 Name audio class update completed!');
    console.log('\n📋 Next steps:');
    console.log('1. The name_audio class should now appear in template management');
    console.log('2. Update the NameVideo template to use name_audio class');
    console.log('3. Test the NameVideo generation with the correct audio classes');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

updateNameAudioClass(); 