const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function testHalloweenLogic() {
  console.log('🎃 Testing alternating logic for Halloween theme...\n');

  try {
    const theme = 'halloween';
    const name = 'NOLAN'; // 5 letters
    
    console.log(`Testing with name: ${name} (${name.length} letters)`);
    console.log(`Theme: ${theme}\n`);

    // Get Halloween theme images
    const { data: themeImages, error } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .ilike('theme', `%${theme}%`);

    if (error) {
      console.error('Error:', error);
      return;
    }

    // Separate left and right safe zone images
    const leftSafeImages = themeImages.filter(img => {
      const safeZones = img.metadata?.review?.safe_zone || [];
      if (Array.isArray(safeZones)) {
        return safeZones.includes('left_safe');
      }
      return false;
    });

    const rightSafeImages = themeImages.filter(img => {
      const safeZones = img.metadata?.review?.safe_zone || [];
      if (Array.isArray(safeZones)) {
        return safeZones.includes('right_safe');
      }
      return false;
    });

    console.log(`📋 Found ${leftSafeImages.length} left-safe and ${rightSafeImages.length} right-safe images for ${theme} theme`);
    
    console.log('\nLeft-safe images:');
    leftSafeImages.forEach((img, index) => {
      console.log(`  ${index + 1}. Asset ${img.id.slice(-8)}`);
    });
    
    console.log('\nRight-safe images:');
    rightSafeImages.forEach((img, index) => {
      console.log(`  ${index + 1}. Asset ${img.id.slice(-8)}`);
    });

    // Simulate the new alternating logic
    console.log(`\n🔄 Simulating alternating pattern for ${name}:`);
    const totalLettersNeeded = name.length;
    const currentImages = 0; // Assume we start with 0 new asset_class images
    const stillNeeded = totalLettersNeeded - currentImages;

    const pattern = [];
    for (let i = 0; i < stillNeeded; i++) {
      const needsLeft = (currentImages + i) % 2 === 0; // Even positions = left, odd = right
      const sourceImages = needsLeft ? leftSafeImages : rightSafeImages;
      const safeZone = needsLeft ? 'left' : 'right';
      const position = currentImages + i + 1;
      
      if (sourceImages.length > 0) {
        // Use images round-robin style if we have multiple
        const imageIndex = Math.floor(i / 2) % sourceImages.length;
        const asset = sourceImages[imageIndex];
        pattern.push({
          position,
          letter: name[i],
          safeZone,
          assetId: asset.id.slice(-8),
          available: true
        });
      } else {
        pattern.push({
          position,
          letter: name[i],
          safeZone,
          assetId: 'MISSING',
          available: false
        });
      }
    }

    pattern.forEach(p => {
      const status = p.available ? '✅' : '❌';
      console.log(`  ${p.position}. ${p.letter} → ${p.safeZone} safe (${p.assetId}) ${status}`);
    });

    // Summary
    const availableCount = pattern.filter(p => p.available).length;
    const missingCount = pattern.filter(p => !p.available).length;
    
    console.log(`\n🎯 Results:`);
    console.log(`  Available: ${availableCount}/${totalLettersNeeded} letter positions`);
    console.log(`  Missing: ${missingCount}/${totalLettersNeeded} letter positions`);
    console.log(`  Will show empty slots: ${missingCount > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`  Pattern alternates correctly: ${pattern.every((p, i) => {
      const expectedLeft = i % 2 === 0;
      return (p.safeZone === 'left') === expectedLeft;
    }) ? '✅ YES' : '❌ NO'}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

testHalloweenLogic();
