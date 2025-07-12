require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAssetPurpose() {
  try {
    console.log('🔧 Fixing missing assetPurpose for Letter Hunt assets...');

    // Get all Letter Hunt audio assets that are missing assetPurpose
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'audio')
      .eq('metadata->>template', 'letter-hunt')
      .is('metadata->>assetPurpose', null);

    if (error) {
      console.error('❌ Error fetching assets:', error);
      return;
    }

    console.log(`📦 Found ${assets.length} Letter Hunt audio assets missing assetPurpose:`);

    for (const asset of assets) {
      console.log(`\n🎯 Processing asset: ${asset.id}`);
      console.log(`   Child: ${asset.metadata.child_name}, Letter: ${asset.metadata.targetLetter}`);
      
      // For now, we'll assume these are title audio assets since that's what we're debugging
      // In a real scenario, you might need more logic to determine the correct purpose
      const newMetadata = {
        ...asset.metadata,
        assetPurpose: 'titleAudio', // Set the missing assetPurpose
        imageType: 'titleAudio' // Also set imageType for consistency
      };

      // Update the asset
      const { error: updateError } = await supabase
        .from('assets')
        .update({ metadata: newMetadata })
        .eq('id', asset.id);

      if (updateError) {
        console.error(`❌ Error updating asset ${asset.id}:`, updateError);
      } else {
        console.log(`✅ Updated asset ${asset.id} with assetPurpose: titleAudio`);
      }
    }

    console.log('\n🎉 Asset purpose fix complete!');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixAssetPurpose();
