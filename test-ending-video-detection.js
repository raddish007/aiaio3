const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function testEndingVideoDetection() {
  console.log('🧪 Testing ending video detection for Letter A...');
  
  const targetLetter = 'A';
  const themeToUse = 'Letter A'; // Theme should match exactly
  
  // Get Letter Hunt assets for Letter A
  const { data: existingAssets, error } = await supabase
    .from('assets')
    .select('*')
    .eq('status', 'approved')
    .contains('tags', ['ending'])
    .eq('theme', `Letter ${targetLetter}`);

  if (error) {
    console.error('❌ Error fetching ending assets:', error);
    return;
  }

  console.log(`\n📦 Found ${existingAssets?.length || 0} ending assets for Letter ${targetLetter}:`);
  existingAssets?.forEach(asset => {
    console.log(`- ${asset.id}: ${asset.title} (${asset.type})`);
    console.log(`  Theme: ${asset.theme}`);
    console.log(`  VideoType: ${asset.metadata?.videoType}`);
    console.log(`  Tags: [${asset.tags.join(', ')}]`);
    console.log(`  URL: ${asset.file_url || 'null'}`);
  });

  // Simulate the asset detection logic from the frontend
  const existingByType = new Map();
  existingAssets?.forEach(asset => {
    let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
    
    if (assetKey) {
      console.log(`\n🔑 Asset key detected: ${assetKey} for ${asset.id}`);
      
      if (asset.type === 'video') {
        // For videos, ONLY use if theme matches exactly
        const currentTheme = asset.metadata?.theme?.toLowerCase();
        const desiredTheme = themeToUse.toLowerCase();
        
        console.log(`🎯 Theme check: "${currentTheme}" vs "${desiredTheme}"`);
        
        if (currentTheme && currentTheme === desiredTheme) {
          existingByType.set(assetKey, {
            url: asset.file_url,
            status: 'ready',
            assetId: asset.id,
            generatedAt: asset.created_at,
            theme: asset.metadata?.theme
          });
          console.log(`✅ Using ending video: ${assetKey} - ${asset.file_url}`);
        } else {
          console.log(`❌ Theme mismatch for video asset - skipping`);
        }
      } else {
        // Non-video assets
        existingByType.set(assetKey, {
          url: asset.file_url,
          status: 'ready',
          assetId: asset.id,
          generatedAt: asset.created_at,
          theme: asset.metadata?.theme
        });
        console.log(`✅ Using asset: ${assetKey}`);
      }
    } else {
      console.log(`⚠️ No asset key found for ${asset.id}`);
    }
  });

  console.log(`\n📋 Final asset mapping:`);
  console.log(`endingVideo status: ${existingByType.has('endingVideo') ? 'ready' : 'missing'}`);
  if (existingByType.has('endingVideo')) {
    const endingVideo = existingByType.get('endingVideo');
    console.log(`endingVideo URL: ${endingVideo.url}`);
    console.log(`endingVideo ID: ${endingVideo.assetId}`);
  }

  // Test with multiple letters
  console.log('\n🔄 Testing ending video detection for all letters...');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  for (const letter of letters) {
    const { data: letterAssets, error: letterError } = await supabase
      .from('assets')
      .select('id, theme, metadata, file_url, tags')
      .eq('status', 'approved')
      .contains('tags', ['ending'])
      .eq('theme', `Letter ${letter}`);

    if (letterError) {
      console.error(`❌ Error for Letter ${letter}:`, letterError);
      continue;
    }

    const endingVideos = letterAssets?.filter(asset => 
      asset.metadata?.videoType === 'endingVideo'
    ) || [];

    if (endingVideos.length > 0) {
      console.log(`✅ Letter ${letter}: ${endingVideos.length} ending video(s) found`);
    } else {
      console.log(`❌ Letter ${letter}: No ending videos found`);
    }
  }
}

testEndingVideoDetection().catch(console.error);
