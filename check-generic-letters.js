const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function checkGenericLetterImages() {
  console.log('🔍 Checking for generic letter background images...\n');

  try {
    // Check for any letter background images regardless of theme
    const { data: allLetterImages, error } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .or('metadata->>asset_class.eq.letter_background,theme.ilike.%letter%')
      .limit(20);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`Found ${allLetterImages?.length || 0} potential letter images`);

    if (allLetterImages && allLetterImages.length > 0) {
      console.log('\nBreakdown by type:');
      
      const newClassImages = allLetterImages.filter(img => img.metadata?.asset_class === 'letter_background');
      console.log(`📝 New asset_class letter_background: ${newClassImages.length}`);
      newClassImages.forEach(img => {
        console.log(`  - ${img.id.slice(-8)}: theme = ${img.metadata?.child_theme || 'none'}`);
      });

      const oldStyleImages = allLetterImages.filter(img => 
        img.metadata?.asset_class !== 'letter_background' && 
        (img.theme?.includes('letter') || (img.metadata?.review?.safe_zone?.includes('left_safe') || img.metadata?.review?.safe_zone?.includes('right_safe')))
      );
      console.log(`📝 Old-style letter images: ${oldStyleImages.length}`);
      oldStyleImages.forEach(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        console.log(`  - ${img.id.slice(-8)}: theme = ${img.theme}, safe_zones = ${JSON.stringify(safeZones)}`);
      });
    }

    // Check themes that have good letter image coverage
    console.log('\n🎨 Checking letter image coverage by theme:');
    const themes = ['animal', 'space', 'princess', 'superhero', 'dinosaur', 'ocean'];
    
    for (const theme of themes) {
      const { data: themeImages } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .eq('type', 'image')
        .ilike('theme', `%${theme}%`);

      if (themeImages) {
        const letterSafeImages = themeImages.filter(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          return safeZones.includes('left_safe') || safeZones.includes('right_safe');
        });
        console.log(`  ${theme}: ${letterSafeImages.length} letter images`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkGenericLetterImages();
