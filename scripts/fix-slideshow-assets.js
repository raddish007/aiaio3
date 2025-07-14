const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixSlideshowAssets() {
  console.log('🛠️  Fixing slideshow assets...\n');

  // 1. Find all approved image assets with safeZone = 'slideshow'
  const { data: slideshowAssets, error } = await supabaseAdmin
    .from('assets')
    .select('*')
    .eq('status', 'approved')
    .eq('type', 'image')
    .eq('metadata->>safeZone', 'slideshow');

  if (error) {
    console.error('❌ Error fetching slideshow assets:', error);
    return;
  }

  if (!slideshowAssets || slideshowAssets.length === 0) {
    console.log('✅ No slideshow assets found that need fixing.');
    return;
  }

  let updatedCount = 0;

  for (const asset of slideshowAssets) {
    const meta = asset.metadata || {};
    let needsUpdate = false;
    if (meta.imageType !== 'bedtime_scene') {
      meta.imageType = 'bedtime_scene';
      needsUpdate = true;
    }
    if (meta.asset_class !== 'bedtime_scene') {
      meta.asset_class = 'bedtime_scene';
      needsUpdate = true;
    }
    if (!needsUpdate) {
      continue;
    }
    const { error: updateError } = await supabaseAdmin
      .from('assets')
      .update({ metadata: meta })
      .eq('id', asset.id);
    if (updateError) {
      console.error(`❌ Error updating asset ${asset.id.slice(-8)}:`, updateError);
    } else {
      console.log(`✅ Updated asset ${asset.id.slice(-8)}: set imageType and asset_class to 'bedtime_scene'`);
      updatedCount++;
    }
  }

  console.log(`\n🎉 Done! Updated ${updatedCount} asset(s).`);
}

fixSlideshowAssets(); 