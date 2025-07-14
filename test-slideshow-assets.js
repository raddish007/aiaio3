const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testSlideshowAssets() {
  console.log('🧪 Testing Slideshow Assets...\n');

  try {
    // Find assets with safeZone = 'slideshow'
    const { data: slideshowAssets, error: slideshowError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .eq('metadata->>safeZone', 'slideshow');

    if (slideshowError) {
      console.error('❌ Error fetching slideshow assets:', slideshowError);
      return;
    }

    console.log(`📊 Found ${slideshowAssets?.length || 0} assets with safeZone = 'slideshow'`);

    if (slideshowAssets && slideshowAssets.length > 0) {
      console.log('\n📝 Slideshow assets details:');
      slideshowAssets.forEach((asset, index) => {
        console.log(`\n${index + 1}. Asset ${asset.id.slice(-8)}:`);
        console.log(`   Theme: ${asset.theme}`);
        console.log(`   Template: ${asset.metadata?.template || 'N/A'}`);
        console.log(`   Asset Class: ${asset.metadata?.asset_class || 'N/A'}`);
        console.log(`   Image Type: ${asset.metadata?.imageType || 'N/A'}`);
        console.log(`   Safe Zone: ${asset.metadata?.safeZone || 'N/A'}`);
        console.log(`   Child Theme: ${asset.metadata?.child_theme || 'N/A'}`);
        console.log(`   Created: ${asset.created_at}`);
      });
    }

    // Check if any of these slideshow assets would be picked up by the lullaby queries
    console.log('\n🔍 Checking if slideshow assets match lullaby queries...');
    
    const themeToUse = 'dogs'; // Test with dogs theme
    
    // Test the exact lullaby bedtime scene query
    const { data: lullabyBedtimeAssets, error: lullabyError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .eq('metadata->>template', 'lullaby')
      .or(`metadata->>asset_class.eq.bedtime_scene,metadata->>imageType.eq.bedtime_scene`)
      .or(`metadata->>child_theme.eq.${themeToUse},theme.ilike.%${themeToUse}%`);

    if (lullabyError) {
      console.error('❌ Error fetching lullaby bedtime assets:', lullabyError);
      return;
    }

    console.log(`📊 Lullaby bedtime scene query found ${lullabyBedtimeAssets?.length || 0} assets`);

    // Check which slideshow assets are NOT being picked up by the lullaby query
    const slideshowAssetIds = new Set(slideshowAssets?.map(a => a.id) || []);
    const lullabyAssetIds = new Set(lullabyBedtimeAssets?.map(a => a.id) || []);
    
    const missingSlideshowAssets = slideshowAssets?.filter(asset => !lullabyAssetIds.has(asset.id)) || [];
    
    if (missingSlideshowAssets.length > 0) {
      console.log(`\n⚠️  Found ${missingSlideshowAssets.length} slideshow assets that are NOT being picked up by lullaby queries:`);
      missingSlideshowAssets.forEach((asset, index) => {
        console.log(`\n${index + 1}. Asset ${asset.id.slice(-8)}:`);
        console.log(`   Theme: ${asset.theme}`);
        console.log(`   Template: ${asset.metadata?.template || 'N/A'}`);
        console.log(`   Asset Class: ${asset.metadata?.asset_class || 'N/A'}`);
        console.log(`   Image Type: ${asset.metadata?.imageType || 'N/A'}`);
        console.log(`   Safe Zone: ${asset.metadata?.safeZone || 'N/A'}`);
        console.log(`   Child Theme: ${asset.metadata?.child_theme || 'N/A'}`);
        console.log(`   Reason: Missing asset_class='bedtime_scene' or imageType='bedtime_scene'`);
      });
    } else {
      console.log('\n✅ All slideshow assets are being picked up by lullaby queries');
    }

    // Check what the asset review form should be updating
    console.log('\n🔧 Asset Review Form Analysis:');
    console.log('When you change safeZone to "slideshow", the form should also update:');
    console.log('- asset_class to "bedtime_scene" (for lullaby queries)');
    console.log('- imageType to "bedtime_scene" (for lullaby queries)');
    console.log('- safeZone to "slideshow" (for display purposes)');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSlideshowAssets(); 