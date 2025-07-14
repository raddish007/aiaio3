const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function debugNameVideoLetterImages() {
  console.log('🎃 Debugging NameVideo letter images for Halloween...\n');

  try {
    const nameToTest = 'NOLAN'; // 5 letters
    const themeToTest = 'halloween';
    const totalLettersNeeded = nameToTest.length;

    console.log(`Testing with name: ${nameToTest} (${totalLettersNeeded} letters needed)`);
    console.log(`Theme: ${themeToTest}\n`);

    // 1. Check new asset_class letter images (should be the primary source)
    console.log('📋 Step 1: Checking new asset_class letter images:');
    const { data: newLetterImages, error: newError } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .eq('metadata->>asset_class', 'letter_background')
      .eq('metadata->>child_theme', themeToTest);

    if (newError) {
      console.error('Error:', newError);
    } else {
      console.log(`  Found: ${newLetterImages?.length || 0} new asset_class letter images`);
    }

    // 2. Check old-style fallback images (what should kick in)
    console.log('\n📋 Step 2: Checking old-style fallback letter images:');
    const { data: oldStyleLetterImages, error: oldError } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .ilike('theme', `%${themeToTest}%`);

    if (oldError) {
      console.error('Error:', oldError);
    } else {
      console.log(`  Found: ${oldStyleLetterImages?.length || 0} old-style images with theme "${themeToTest}"`);
      
      if (oldStyleLetterImages && oldStyleLetterImages.length > 0) {
        // Filter for letter-safe images
        const letterSafeImages = oldStyleLetterImages.filter(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          return safeZones.includes('left_safe') || safeZones.includes('right_safe');
        });
        
        console.log(`  Letter-safe images: ${letterSafeImages.length}`);
        letterSafeImages.forEach((img, index) => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          console.log(`    ${index + 1}. Asset ${img.id.slice(-8)}: Safe zones = ${JSON.stringify(safeZones)}`);
        });

        // Simulate the current logic for determining how many images we'd get
        const currentLength = 0; // Assume no new images found
        const needed = Math.max(0, totalLettersNeeded - currentLength);
        const availableForFallback = letterSafeImages.slice(0, needed);
        
        console.log(`\n  Fallback logic simulation:`);
        console.log(`    Current letter images: ${currentLength}`);
        console.log(`    Total needed: ${totalLettersNeeded}`);
        console.log(`    Still needed: ${needed}`);
        console.log(`    Available for fallback: ${availableForFallback.length}`);
        console.log(`    Final total: ${currentLength + availableForFallback.length}`);
        console.log(`    Sufficient: ${(currentLength + availableForFallback.length) >= totalLettersNeeded ? '✅ YES' : '❌ NO'}`);
      }
    }

    // 3. Check if there are any generic letter images that could be used
    console.log('\n📋 Step 3: Checking generic letter images (no theme filter):');
    const { data: genericLetterImages, error: genericError } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .eq('metadata->>asset_class', 'letter_background')
      .limit(10);

    if (genericError) {
      console.error('Error:', genericError);
    } else {
      console.log(`  Found: ${genericLetterImages?.length || 0} generic letter background images`);
      if (genericLetterImages && genericLetterImages.length > 0) {
        genericLetterImages.forEach((img, index) => {
          console.log(`    ${index + 1}. Asset ${img.id.slice(-8)}: Theme = ${img.metadata?.child_theme || 'none'}`);
        });
      }
    }

    // 4. Recommendations
    console.log('\n🎯 Recommendations:');
    const totalAvailable = (newLetterImages?.length || 0) + 
      (oldStyleLetterImages?.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        return safeZones.includes('left_safe') || safeZones.includes('right_safe');
      }).length || 0);

    if (totalAvailable < totalLettersNeeded) {
      console.log(`❌ Insufficient images for "${nameToTest}" (need ${totalLettersNeeded}, have ${totalAvailable})`);
      console.log(`Solutions:`);
      console.log(`  1. Generate ${totalLettersNeeded - totalAvailable} more letter background images for Halloween theme`);
      console.log(`  2. Or use a shorter name that fits within ${totalAvailable} letters`);
      console.log(`  3. Or add fallback to generic letter images regardless of theme`);
    } else {
      console.log(`✅ Should have enough images for "${nameToTest}"`);
    }

  } catch (error) {
    console.error('Error in debug:', error);
  }
}

debugNameVideoLetterImages();
