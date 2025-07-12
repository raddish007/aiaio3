require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllLetterHuntAssets() {
  try {
    console.log('🔍 Checking all Letter Hunt assets for missing metadata...');

    // Check audio assets
    const { data: audioAssets, error: audioError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'audio')
      .eq('metadata->>template', 'letter-hunt');

    if (audioError) {
      console.error('❌ Error fetching audio assets:', audioError);
      return;
    }

    console.log(`\n🎵 Letter Hunt Audio Assets (${audioAssets.length} found):`);
    audioAssets.forEach(asset => {
      const hasAssetPurpose = !!asset.metadata?.assetPurpose;
      const hasTemplateContextPurpose = !!asset.metadata?.template_context?.asset_purpose;
      const status = hasAssetPurpose ? '✅' : (hasTemplateContextPurpose ? '🔄' : '❌');
      
      console.log(`   ${status} ${asset.id} | ${asset.status} | Child: ${asset.metadata?.child_name} | Letter: ${asset.metadata?.targetLetter} | Purpose: ${asset.metadata?.assetPurpose || asset.metadata?.template_context?.asset_purpose || 'MISSING'}`);
    });

    // Check image assets
    const { data: imageAssets, error: imageError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'image')
      .eq('metadata->>template', 'letter-hunt');

    if (imageError) {
      console.error('❌ Error fetching image assets:', imageError);
      return;
    }

    console.log(`\n🖼️ Letter Hunt Image Assets (${imageAssets.length} found):`);
    imageAssets.forEach(asset => {
      const hasImageType = !!asset.metadata?.imageType;
      const status = hasImageType ? '✅' : '❌';
      
      console.log(`   ${status} ${asset.id} | ${asset.status} | Child: ${asset.metadata?.child_name} | Letter: ${asset.metadata?.targetLetter} | Type: ${asset.metadata?.imageType || 'MISSING'}`);
    });

    // Summary
    const missingAudioPurpose = audioAssets.filter(a => !a.metadata?.assetPurpose && !a.metadata?.template_context?.asset_purpose);
    const missingImageType = imageAssets.filter(a => !a.metadata?.imageType);

    console.log(`\n📊 Summary:`);
    console.log(`   Audio assets missing purpose: ${missingAudioPurpose.length}`);
    console.log(`   Image assets missing type: ${missingImageType.length}`);

    if (missingAudioPurpose.length > 0) {
      console.log('\n❌ Audio assets that need fixing:');
      missingAudioPurpose.forEach(asset => {
        console.log(`   ${asset.id} | Child: ${asset.metadata?.child_name} | Letter: ${asset.metadata?.targetLetter}`);
      });
    }

    if (missingImageType.length > 0) {
      console.log('\n❌ Image assets that need fixing:');
      missingImageType.forEach(asset => {
        console.log(`   ${asset.id} | Child: ${asset.metadata?.child_name} | Letter: ${asset.metadata?.targetLetter}`);
      });
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkAllLetterHuntAssets();
