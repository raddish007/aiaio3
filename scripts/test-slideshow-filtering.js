const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSlideshowFiltering() {
  console.log('🔍 Testing slideshow image filtering...\n');

  try {
    // Test with a specific theme
    const testTheme = 'space'; // Change this to test different themes
    
    console.log(`📊 Fetching assets for theme: "${testTheme}"`);
    
    // Query for all approved images with matching theme
    const { data: allImages, error: imagesError } = await supabase
      .from('assets')
      .select('id, file_url, theme, safe_zone, tags, metadata')
      .eq('type', 'image')
      .eq('status', 'approved')
      .ilike('theme', `%${testTheme}%`)
      .limit(20);

    if (imagesError) {
      console.error('❌ Error fetching images:', imagesError);
      return;
    }

    console.log(`✅ Found ${allImages.length} total images for theme "${testTheme}"\n`);

    // Filter images based on metadata.review.safe_zone array
    const availableImages = allImages || [];
    
    // Filter for intro and outro images
    const introImages = availableImages.filter(img => {
      const safeZones = img.metadata?.review?.safe_zone || [];
      return safeZones.includes('intro_safe');
    });

    const outroImages = availableImages.filter(img => {
      const safeZones = img.metadata?.review?.safe_zone || [];
      return safeZones.includes('outro_safe');
    });

    // Filter for slideshow images - use all_ok safe zone for lullaby template
    const slideshowImages = availableImages.filter(img => {
      const safeZones = img.metadata?.review?.safe_zone || [];
      // Include images that are marked as all_ok for slideshow
      return safeZones.includes('all_ok');
    });

    console.log('📈 Filtering Results:');
    console.log(`  - Intro images: ${introImages.length}`);
    console.log(`  - Outro images: ${outroImages.length}`);
    console.log(`  - Slideshow images: ${slideshowImages.length} (need 23 for full slideshow)\n`);

    // Show details for each category
    if (introImages.length > 0) {
      console.log('🎬 Intro Images:');
      introImages.forEach((img, i) => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        console.log(`  ${i + 1}. ID: ${img.id} | Safe zones: [${safeZones.join(', ')}]`);
      });
      console.log('');
    }

    if (outroImages.length > 0) {
      console.log('🌙 Outro Images:');
      outroImages.forEach((img, i) => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        console.log(`  ${i + 1}. ID: ${img.id} | Safe zones: [${safeZones.join(', ')}]`);
      });
      console.log('');
    }

    if (slideshowImages.length > 0) {
      console.log('🖼️ Slideshow Images:');
      slideshowImages.forEach((img, i) => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        console.log(`  ${i + 1}. ID: ${img.id} | Safe zones: [${safeZones.join(', ')}]`);
      });
      console.log('');
    }

    // Test with different themes
    const testThemes = ['animals', 'space', 'dinosaurs', 'princesses'];
    console.log('🧪 Testing multiple themes:');
    
    for (const theme of testThemes) {
      const { data: themeImages } = await supabase
        .from('assets')
        .select('id, theme, metadata')
        .eq('type', 'image')
        .eq('status', 'approved')
        .ilike('theme', `%${theme}%`)
        .limit(5);

      const themeSlideshowImages = (themeImages || []).filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        return safeZones.includes('all_ok');
      });

      console.log(`  ${theme}: ${themeImages?.length || 0} total, ${themeSlideshowImages.length} slideshow`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSlideshowFiltering(); 