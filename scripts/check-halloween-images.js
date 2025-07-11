const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHalloweenImages() {
  console.log('🔍 Checking Halloween images and their safe zones...\n');

  try {
    // Get all approved Halloween images
    const { data: halloweenImages, error } = await supabase
      .from('assets')
      .select('id, file_url, theme, safe_zone, tags, metadata')
      .eq('type', 'image')
      .eq('status', 'approved')
      .ilike('theme', '%halloween%');

    if (error) {
      console.error('❌ Error fetching Halloween images:', error);
      return;
    }

    console.log(`📊 Found ${halloweenImages.length} Halloween images:\n`);

    if (halloweenImages.length === 0) {
      console.log('❌ No Halloween images found!');
      return;
    }

    // Group by safe zone
    const imagesBySafeZone = {};
    
    halloweenImages.forEach(img => {
      const safeZones = img.metadata?.review?.safe_zone || [];
      const safeZoneKey = safeZones.length > 0 ? safeZones.join(', ') : 'no_safe_zone';
      
      if (!imagesBySafeZone[safeZoneKey]) {
        imagesBySafeZone[safeZoneKey] = [];
      }
      imagesBySafeZone[safeZoneKey].push(img);
    });

    // Display results
    Object.entries(imagesBySafeZone).forEach(([safeZone, images]) => {
      console.log(`📍 Safe Zone: "${safeZone}" (${images.length} images)`);
      images.forEach(img => {
        console.log(`   - ${img.theme} (ID: ${img.id})`);
      });
      console.log('');
    });

    // Check specifically for center_safe images
    const centerSafeImages = halloweenImages.filter(img => {
      const safeZones = img.metadata?.review?.safe_zone || [];
      return safeZones.includes('center_safe');
    });

    console.log(`🎯 Center Safe Images: ${centerSafeImages.length}`);
    if (centerSafeImages.length > 0) {
      centerSafeImages.forEach(img => {
        console.log(`   - ${img.theme} (ID: ${img.id})`);
      });
    } else {
      console.log('   ❌ No center_safe images found for Halloween theme!');
    }

    // Check for any images that could be used for intro/outro
    const potentialIntroOutroImages = halloweenImages.filter(img => {
      const safeZones = img.metadata?.review?.safe_zone || [];
      return safeZones.includes('center_safe') || 
             safeZones.includes('intro_safe') || 
             safeZones.includes('outro_safe') ||
             safeZones.includes('all_ok');
    });

    console.log(`\n🎬 Potential Intro/Outro Images: ${potentialIntroOutroImages.length}`);
    if (potentialIntroOutroImages.length > 0) {
      potentialIntroOutroImages.forEach(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        console.log(`   - ${img.theme} (ID: ${img.id}) - Safe Zones: [${safeZones.join(', ')}]`);
      });
    } else {
      console.log('   ❌ No suitable intro/outro images found!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkHalloweenImages(); 