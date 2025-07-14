const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function debugHalloweenLetterImages() {
  console.log('🎃 Debugging Halloween letter images...\n');

  try {
    // Check for Halloween-themed letter images with new asset_class system
    console.log('📋 Checking new asset_class letter images for Halloween theme:');
    const { data: newLetterImages, error: newError } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .eq('metadata->>asset_class', 'letter_background')
      .eq('metadata->>child_theme', 'halloween');

    if (newError) {
      console.error('Error fetching new letter images:', newError);
    } else {
      console.log(`Found ${newLetterImages?.length || 0} new asset_class letter images for Halloween`);
      if (newLetterImages && newLetterImages.length > 0) {
        newLetterImages.forEach(img => {
          console.log(`  - Asset ${img.id.slice(-8)}: ${img.status} | Safe Zone: ${img.metadata?.safe_zone || 'none'}`);
        });
      }
    }

    // Check for old-style Halloween letter images with safe_zone
    console.log('\n📋 Checking old-style letter images for Halloween theme:');
    const { data: oldLetterImages, error: oldError } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .ilike('theme', '%halloween%');

    if (oldError) {
      console.error('Error fetching old letter images:', oldError);
    } else {
      console.log(`Found ${oldLetterImages?.length || 0} old-style images with Halloween theme`);
      
      if (oldLetterImages && oldLetterImages.length > 0) {
        // Filter for images with letter-related safe zones
        const letterSafeImages = oldLetterImages.filter(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          const hasLetterSafeZone = safeZones.includes('left_safe') || safeZones.includes('right_safe');
          return hasLetterSafeZone;
        });
        
        console.log(`  - ${letterSafeImages.length} have letter-related safe zones (left_safe or right_safe)`);
        
        letterSafeImages.forEach(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          console.log(`  - Asset ${img.id.slice(-8)}: ${img.status} | Safe Zones: ${JSON.stringify(safeZones)}`);
        });
      }
    }

    // Check total unique images available
    const allImages = [
      ...(newLetterImages || []),
      ...(oldLetterImages?.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        return safeZones.includes('left_safe') || safeZones.includes('right_safe');
      }) || [])
    ];

    // Remove duplicates by ID
    const uniqueImages = allImages.filter((img, index, arr) => 
      arr.findIndex(other => other.id === img.id) === index
    );

    console.log(`\n🎯 Summary:`);
    console.log(`  - Total unique Halloween letter images available: ${uniqueImages.length}`);
    console.log(`  - New asset_class images: ${newLetterImages?.length || 0}`);
    console.log(`  - Old-style letter images: ${oldLetterImages?.filter(img => {
      const safeZones = img.metadata?.review?.safe_zone || [];
      return safeZones.includes('left_safe') || safeZones.includes('right_safe');
    }).length || 0}`);

    // Test with a specific name like "NOLAN" (5 letters)
    console.log(`\n🧪 Testing with name "NOLAN" (5 total letters):`);
    console.log(`  - Would need: 5 letter background images`);
    console.log(`  - Have available: ${uniqueImages.length} letter background images`);
    console.log(`  - Sufficient: ${uniqueImages.length >= 5 ? '✅ YES' : '❌ NO'}`);

  } catch (error) {
    console.error('Error in debug:', error);
  }
}

debugHalloweenLetterImages();
