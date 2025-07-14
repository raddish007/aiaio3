const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function countSlideshowDogs() {
  console.log('🐕 Counting slideshow dogs assets...\n');

  // Find all approved image assets with safeZone = 'slideshow' and theme = 'dogs'
  const { data: slideshowDogs, error } = await supabaseAdmin
    .from('assets')
    .select('*')
    .eq('status', 'approved')
    .eq('type', 'image')
    .eq('metadata->>safeZone', 'slideshow')
    .eq('theme', 'dogs');

  if (error) {
    console.error('❌ Error fetching slideshow dogs:', error);
    return;
  }

  console.log(`📊 Found ${slideshowDogs?.length || 0} slideshow dogs assets`);

  if (slideshowDogs && slideshowDogs.length > 0) {
    console.log('\n📝 Slideshow dogs details:');
    slideshowDogs.forEach((asset, index) => {
      console.log(`\n${index + 1}. Asset ${asset.id.slice(-8)}:`);
      console.log(`   Theme: ${asset.theme}`);
      console.log(`   Template: ${asset.metadata?.template || 'N/A'}`);
      console.log(`   Asset Class: ${asset.metadata?.asset_class || 'N/A'}`);
      console.log(`   Image Type: ${asset.metadata?.imageType || 'N/A'}`);
      console.log(`   Safe Zone: ${asset.metadata?.safeZone || 'N/A'}`);
      console.log(`   Child Theme: ${asset.metadata?.child_theme || 'N/A'}`);
      console.log(`   Created: ${asset.created_at}`);
      
      // Check if it has the correct fields for lullaby queries
      const hasCorrectFields = (asset.metadata?.asset_class === 'bedtime_scene' || asset.metadata?.imageType === 'bedtime_scene');
      console.log(`   ✅ Lullaby Query Ready: ${hasCorrectFields ? 'YES' : 'NO'}`);
    });

    // Count how many are ready for lullaby queries
    const readyForLullaby = slideshowDogs.filter(asset => 
      asset.metadata?.asset_class === 'bedtime_scene' || asset.metadata?.imageType === 'bedtime_scene'
    );
    
    console.log(`\n🎯 Summary:`);
    console.log(`   Total slideshow dogs: ${slideshowDogs.length}`);
    console.log(`   Ready for lullaby queries: ${readyForLullaby.length}`);
    console.log(`   Missing correct fields: ${slideshowDogs.length - readyForLullaby.length}`);
  }
}

countSlideshowDogs(); 