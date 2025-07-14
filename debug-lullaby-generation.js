const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function debugLullabyGeneration() {
  console.log('🌙 Debugging Lullaby video generation for Nolan...\n');

  try {
    const nameToUse = 'Nolan';
    const themeToUse = 'halloween'; // Or whatever theme was used
    
    console.log(`Testing with name: ${nameToUse}, theme: ${themeToUse}\n`);

    // Simulate the exact same queries as the Lullaby page
    const [
      specificAssets,
      bedtimeImages, 
      backgroundMusicAsset,
      themeImages,
      oldStyleThemeImages,
      oldStyleSlideshowImages
    ] = await Promise.all([
      // Child-specific assets
      supabase
        .from('assets')
        .select('*')
        .in('status', ['approved', 'pending'])
        .eq('metadata->>template', 'lullaby')
        .eq('metadata->>child_name', nameToUse),
      
      // Bedtime scene images for theme
      supabase
        .from('assets')
        .select('*')
        .in('status', ['approved', 'pending'])
        .eq('type', 'image')
        .eq('metadata->>asset_class', 'bedtime_scene')
        .eq('metadata->>child_theme', themeToUse),
      
      // Background music (DreamDrip asset)
      supabase
        .from('assets')
        .select('*')
        .eq('id', '2095fd08-1cb1-4373-bafa-f6115dd7dad2')
        .single(),
      
      // Theme-specific intro/outro images
      supabase
        .from('assets')
        .select('*')
        .in('status', ['approved', 'pending'])
        .eq('type', 'image')
        .in('metadata->>asset_class', ['bedtime_intro', 'bedtime_outro'])
        .eq('metadata->>child_theme', themeToUse),
      
      // Fallback: Old-style theme-matching images with safe_zone
      supabase
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .eq('type', 'image')
        .ilike('theme', `%${themeToUse}%`),
      
      // Fallback: Old-style slideshow images with 'all_ok' safe_zone
      supabase
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .eq('type', 'image')
        .ilike('theme', `%${themeToUse}%`)
    ]);

    console.log('🔍 Asset fetch results:');
    console.log(`  specificAssets: ${specificAssets.data?.length || 0}`);
    console.log(`  bedtimeImages: ${bedtimeImages.data?.length || 0}`);
    console.log(`  backgroundMusic: ${backgroundMusicAsset.data ? 'found' : 'missing'}`);
    console.log(`  themeImages: ${themeImages.data?.length || 0}`);
    console.log(`  oldStyleThemeImages: ${oldStyleThemeImages.data?.length || 0}`);
    console.log(`  oldStyleSlideshowImages: ${oldStyleSlideshowImages.data?.length || 0}\n`);

    // Check background music status
    const backgroundMusicStatus = backgroundMusicAsset.data ? 'ready' : 'missing';
    console.log(`🎵 Background Music: ${backgroundMusicStatus}`);
    if (backgroundMusicAsset.data) {
      console.log(`   URL: ${backgroundMusicAsset.data.file_url ? 'Present' : 'Missing'}`);
    }

    // Check specific assets for intro/outro audio
    let introAudioStatus = 'missing';
    let outroAudioStatus = 'missing';
    
    if (specificAssets.data) {
      console.log(`\n🎤 Processing ${specificAssets.data.length} specific assets:`);
      specificAssets.data.forEach(asset => {
        const assetClass = asset.metadata?.asset_class || asset.metadata?.audio_class;
        const status = asset.status === 'approved' ? 'ready' : 'generating';
        
        console.log(`   Asset ${asset.id.slice(-8)}: type=${asset.type}, class=${assetClass}, status=${status}`);
        
        if (assetClass === 'bedtime_greeting') {
          introAudioStatus = status;
          console.log(`   → Intro Audio: ${status}`);
        } else if (assetClass === 'goodnight_message') {
          outroAudioStatus = status;
          console.log(`   → Outro Audio: ${status}`);
        }
      });
    }

    // Simulate asset summary calculation
    const BEDTIME_IMAGES_TARGET = 15;
    
    // Count bedtime images
    let bedtimeImageCount = bedtimeImages.data?.length || 0;
    
    // Add old-style slideshow images if needed
    if (oldStyleSlideshowImages.data && bedtimeImageCount < BEDTIME_IMAGES_TARGET) {
      const oldStyleImages = oldStyleSlideshowImages.data.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        if (Array.isArray(safeZones)) {
          return safeZones.includes('all_ok');
        }
        return false;
      });
      
      const additionalCount = Math.min(oldStyleImages.length, BEDTIME_IMAGES_TARGET - bedtimeImageCount);
      bedtimeImageCount += additionalCount;
      console.log(`\n🛏️ Bedtime Images: ${bedtimeImageCount} (${additionalCount} from legacy)`);
    }

    // Calculate completion
    const baseAssets = 5; // backgroundMusic, introImage, outroImage, introAudio, outroAudio
    const totalBedtimeImages = Math.max(bedtimeImageCount, BEDTIME_IMAGES_TARGET);
    const totalAssets = baseAssets + totalBedtimeImages;
    
    let readyAssets = 0;
    
    // Count ready assets
    if (backgroundMusicStatus === 'ready') readyAssets++;
    if (introAudioStatus === 'ready') readyAssets++;
    if (outroAudioStatus === 'ready') readyAssets++;
    // Note: intro/outro images might be missing but not blocking
    
    readyAssets += bedtimeImageCount; // Count all found bedtime images as ready
    
    const completionPercentage = Math.round((readyAssets / totalAssets) * 100);

    console.log(`\n📊 Generation Check:`);
    console.log(`   Background Music ready: ${backgroundMusicStatus === 'ready' ? '✅' : '❌'}`);
    console.log(`   Intro Audio ready: ${introAudioStatus === 'ready' ? '✅' : '❌'}`);
    console.log(`   Completion: ${completionPercentage}% (need 60%+): ${completionPercentage >= 60 ? '✅' : '❌'}`);
    console.log(`   Total assets: ${readyAssets}/${totalAssets}`);
    
    const canGenerate = backgroundMusicStatus === 'ready' && 
                       introAudioStatus === 'ready' && 
                       completionPercentage >= 60;
    
    console.log(`\n🎯 Can Generate Video: ${canGenerate ? '✅ YES' : '❌ NO'}`);
    
    if (!canGenerate) {
      console.log('\n❌ Blocking issues:');
      if (backgroundMusicStatus !== 'ready') console.log('   - Background music not ready');
      if (introAudioStatus !== 'ready') console.log('   - Intro audio not ready');
      if (completionPercentage < 60) console.log(`   - Completion too low (${completionPercentage}% < 60%)`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugLullabyGeneration();
