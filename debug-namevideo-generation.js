const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function debugNameVideoGeneration() {
  console.log('🎥 Debugging NameVideo generation for Nolan...\n');

  try {
    const nameToUse = 'Nolan';
    const themeToUse = 'halloween'; // Or whatever theme was used
    const letters = nameToUse.toUpperCase().split('');
    const uniqueLetters = [...new Set(letters)];
    
    console.log(`Testing with name: ${nameToUse}, theme: ${themeToUse}`);
    console.log(`Letters: ${letters.join(', ')} (${letters.length} total)`);
    console.log(`Unique letters: ${uniqueLetters.join(', ')} (${uniqueLetters.length} unique)\n`);

    // Simulate the exact same queries as the NameVideo page
    const [
      specificAssets,
      letterBackgroundImages,
      backgroundMusicAsset,
      oldStyleImages,
      letterAudioAssets
    ] = await Promise.all([
      // Child-specific assets for name video
      supabase
        .from('assets')
        .select('*')
        .in('status', ['approved', 'pending'])
        .eq('metadata->>template', 'name-video')
        .eq('metadata->>child_name', nameToUse),
      
      // Letter background images for theme
      supabase
        .from('assets')
        .select('*')
        .in('status', ['approved', 'pending'])
        .eq('type', 'image')
        .eq('metadata->>asset_class', 'letter_background')
        .eq('metadata->>child_theme', themeToUse),
      
      // Background music (DreamDrip asset)
      supabase
        .from('assets')
        .select('*')
        .eq('id', '2095fd08-1cb1-4373-bafa-f6115dd7dad2')
        .single(),
      
      // Old-style images for fallback
      supabase
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .eq('type', 'image')
        .ilike('theme', `%${themeToUse}%`),
      
      // Letter audio assets (no child_name filter for generic letters)
      supabase
        .from('assets')
        .select('*')
        .in('status', ['approved', 'pending'])
        .eq('type', 'audio')
        .or(`metadata->>asset_class.eq.letter_audio,metadata->>audio_class.eq.letter_audio`)
    ]);

    console.log('🔍 Asset fetch results:');
    console.log(`  specificAssets: ${specificAssets.data?.length || 0}`);
    console.log(`  letterBackgroundImages: ${letterBackgroundImages.data?.length || 0}`);
    console.log(`  backgroundMusic: ${backgroundMusicAsset.data ? 'found' : 'missing'}`);
    console.log(`  oldStyleImages: ${oldStyleImages.data?.length || 0}`);
    console.log(`  letterAudioAssets: ${letterAudioAssets.data?.length || 0}\n`);

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
        
        if (assetClass === 'name_audio') {
          introAudioStatus = status;
          outroAudioStatus = status; // Same audio for both
          console.log(`   → Name Audio (intro/outro): ${status}`);
        }
      });
    }

    // Check letter audio coverage
    const letterAudioCoverage = {};
    if (letterAudioAssets.data) {
      console.log(`\n📝 Letter audio assets found: ${letterAudioAssets.data.length}`);
      letterAudioAssets.data.forEach(asset => {
        const letter = asset.metadata?.letter;
        if (letter && uniqueLetters.includes(letter.toUpperCase())) {
          letterAudioCoverage[letter.toUpperCase()] = {
            status: asset.status === 'approved' ? 'ready' : 'generating',
            url: asset.file_url
          };
          console.log(`   Letter ${letter.toUpperCase()}: ${asset.status === 'approved' ? 'ready' : 'generating'}`);
        }
      });
    }
    
    const missingLetterAudio = uniqueLetters.filter(letter => !letterAudioCoverage[letter]);
    console.log(`   Missing letter audio: ${missingLetterAudio.length > 0 ? missingLetterAudio.join(', ') : 'None'}`);

    // Simulate letter image logic - check both new and old styles
    let letterImageCount = 0;
    
    // New style images
    if (letterBackgroundImages.data) {
      const leftImages = letterBackgroundImages.data.filter(img => 
        img.metadata?.safe_zone === 'left' || img.metadata?.position === 'left'
      );
      const rightImages = letterBackgroundImages.data.filter(img => 
        img.metadata?.safe_zone === 'right' || img.metadata?.position === 'right'
      );
      
      console.log(`\n🖼️ New style letter background images:`);
      console.log(`   Left safe zone: ${leftImages.length}`);
      console.log(`   Right safe zone: ${rightImages.length}`);
      
      // Alternating logic needs both left and right images
      const alternatingCount = Math.min(leftImages.length, rightImages.length) * 2;
      letterImageCount = Math.min(alternatingCount, letters.length);
      console.log(`   Alternating pairs available: ${alternatingCount} (need ${letters.length})`);
    }
    
    // Old style fallback if needed
    if (letterImageCount < letters.length && oldStyleImages.data) {
      const oldLeftImages = oldStyleImages.data.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        return safeZones.includes('left_safe');
      });
      const oldRightImages = oldStyleImages.data.filter(img => {
        const safeZones = img.metadata?.review?.safe_zone || [];
        return safeZones.includes('right_safe');
      });
      
      console.log(`\n🖼️ Old style fallback images:`);
      console.log(`   Left safe zone: ${oldLeftImages.length}`);
      console.log(`   Right safe zone: ${oldRightImages.length}`);
      
      const oldAlternatingCount = Math.min(oldLeftImages.length, oldRightImages.length) * 2;
      const totalAvailable = letterImageCount + oldAlternatingCount;
      letterImageCount = Math.min(totalAvailable, letters.length);
      console.log(`   Additional alternating pairs: ${oldAlternatingCount}`);
    }
    
    console.log(`\n📊 Final letter image count: ${letterImageCount}/${letters.length} needed`);

    // Calculate NameVideo generation requirements
    console.log(`\n📊 Generation Check:`);
    console.log(`   Background Music ready: ${backgroundMusicStatus === 'ready' ? '✅' : '❌'}`);
    console.log(`   Intro Audio ready: ${introAudioStatus === 'ready' ? '✅' : '❌'}`);
    console.log(`   Letter images available: ${letterImageCount >= 10 ? '✅' : '❌'} (${letterImageCount}/10 minimum)`);
    console.log(`   Letter audio coverage: ${missingLetterAudio.length === 0 ? '✅' : '❌'} (${uniqueLetters.length - missingLetterAudio.length}/${uniqueLetters.length})`);
    
    // Calculate completion percentage
    const baseAssets = 4; // backgroundMusic, introAudio, outroAudio, intro/outro images
    const letterAssets = letters.length * 2; // letter images + letter audio
    const totalAssets = baseAssets + letterAssets;
    
    let readyAssets = 0;
    if (backgroundMusicStatus === 'ready') readyAssets++;
    if (introAudioStatus === 'ready') readyAssets += 2; // intro and outro use same audio
    
    readyAssets += letterImageCount; // Add available letter images
    readyAssets += (uniqueLetters.length - missingLetterAudio.length); // Add available letter audio
    
    const completionPercentage = Math.round((readyAssets / totalAssets) * 100);
    console.log(`   Completion: ${completionPercentage}% (need 50%+): ${completionPercentage >= 50 ? '✅' : '❌'}`);
    console.log(`   Total assets: ${readyAssets}/${totalAssets}`);
    
    // NameVideo canGenerateVideo logic (updated):
    const hasRequiredAudio = backgroundMusicStatus === 'ready' && introAudioStatus === 'ready';
    const requiredImages = letters.length; // Dynamic based on name length
    const hasMinimumImages = letterImageCount >= requiredImages;
    const hasMinimumCompletion = completionPercentage >= 50;
    
    console.log(`   Letter images required: ${requiredImages} (name length)`);
    console.log(`   Letter images available: ${letterImageCount}`);
    
    const canGenerate = hasRequiredAudio && hasMinimumImages && hasMinimumCompletion;
    
    console.log(`\n🎯 Can Generate Video: ${canGenerate ? '✅ YES' : '❌ NO'}`);
    
    if (!canGenerate) {
      console.log('\n❌ Blocking issues:');
      if (!hasRequiredAudio) {
        if (backgroundMusicStatus !== 'ready') console.log('   - Background music not ready');
        if (introAudioStatus !== 'ready') console.log('   - Intro audio not ready');
      }
      if (!hasMinimumImages) console.log(`   - Not enough letter images (${letterImageCount} < ${requiredImages})`);
      if (!hasMinimumCompletion) console.log(`   - Completion too low (${completionPercentage}% < 50%)`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugNameVideoGeneration();
