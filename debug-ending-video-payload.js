const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function debugEndingVideoPayload() {
  console.log('🐛 Debugging ending video payload construction...');
  
  const targetLetter = 'A';
  const themeToUse = 'dogs'; // Example theme
  
  console.log(`\n🎯 Testing with: targetLetter=${targetLetter}, theme=${themeToUse}`);
  
  // Simulate the same query as the frontend
  const { data: existingAssets, error } = await supabase
    .from('assets')
    .select('*')
    .eq('status', 'approved')
    .or(`theme.ilike.%Letter ${targetLetter}%,metadata->targetLetter.eq.${targetLetter}`)
    .eq('metadata->template', 'letter-hunt');

  if (error) {
    console.error('❌ Error fetching assets:', error);
    return;
  }

  console.log(`📦 Found ${existingAssets.length} assets for Letter ${targetLetter}`);

  // Simulate the asset detection logic
  const existingByType = new Map();
  existingAssets?.forEach(asset => {
    let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
    
    if (assetKey) {
      const existingAsset = existingByType.get(assetKey);
      let shouldUseThisAsset = false;
      
      if (asset.type === 'video') {
        // Special case for ending videos - they only need to match the target letter
        if (assetKey === 'endingVideo') {
          const assetTargetLetter = asset.metadata?.targetLetter;
          const assetTheme = asset.theme;
          
          // Check if this ending video matches our target letter
          if (assetTargetLetter === targetLetter || assetTheme === `Letter ${targetLetter}`) {
            console.log(`✅ Found ending video for Letter ${targetLetter}: ${asset.id} (theme: ${assetTheme})`);
            shouldUseThisAsset = true;
          } else {
            console.log(`⚠️ Skipping ending video - letter mismatch: asset(${assetTargetLetter}/${assetTheme}) !== target(${targetLetter})`);
          }
        } else {
          console.log(`🎥 Other video type ${assetKey}: skipping for this test`);
        }
      } else {
        console.log(`📄 Non-video asset ${assetKey}: skipping for this test`);
      }
      
      if (shouldUseThisAsset) {
        existingByType.set(assetKey, {
          url: asset.file_url,
          status: 'ready',
          assetId: asset.id,
          generatedAt: asset.created_at,
          theme: asset.metadata?.theme,
          targetLetter: asset.metadata?.targetLetter
        });
        console.log(`✅ Mapped asset: ${assetKey} -> ${asset.id}`);
      }
    } else {
      console.log(`⚠️ No asset key found for ${asset.id} (type: ${asset.type})`);
    }
  });

  console.log(`\n📋 Asset mapping results:`);
  console.log(`endingVideo: ${existingByType.has('endingVideo') ? 'FOUND' : 'MISSING'}`);
  
  if (existingByType.has('endingVideo')) {
    const endingVideo = existingByType.get('endingVideo');
    console.log(`  - Asset ID: ${endingVideo.assetId}`);
    console.log(`  - URL: ${endingVideo.url}`);
    console.log(`  - Status: ${endingVideo.status}`);
    console.log(`  - Theme: ${endingVideo.theme}`);
    console.log(`  - Target Letter: ${endingVideo.targetLetter}`);
  }

  // Simulate payload construction
  console.log(`\n🏗️ Simulating payload construction...`);
  
  const endingVideoAsset = existingByType.get('endingVideo') ? {
    ...existingByType.get('endingVideo'),
    type: 'video',
    name: 'Ending Video',
    description: `Letter ${targetLetter} ending video with colorful celebration`
  } : {
    type: 'video',
    name: 'Ending Video',
    description: `Letter ${targetLetter} ending video with colorful celebration`,
    status: 'missing'
  };

  console.log(`endingVideo payload:`, JSON.stringify(endingVideoAsset, null, 2));

  // Check if it would be included in cleanedAssets
  const allowedAssetKeys = [
    'titleCard', 'titleAudio',
    'introVideo', 'introAudio',
    'intro2Video', 'intro2Audio',
    'signImage', 'signAudio',
    'bookImage', 'bookAudio',
    'groceryImage', 'groceryAudio',
    'happyDanceVideo', 'happyDanceAudio',
    'endingVideo', 'endingAudio',
    'backgroundMusic'
  ];

  console.log(`\n🧹 Checking if endingVideo would be cleaned and sent...`);
  console.log(`endingVideo in allowedAssetKeys: ${allowedAssetKeys.includes('endingVideo')}`);
  
  if (allowedAssetKeys.includes('endingVideo') && endingVideoAsset.status === 'ready') {
    console.log(`✅ endingVideo would be sent to API:`, {
      url: endingVideoAsset.url,
      status: endingVideoAsset.status
    });
  } else {
    console.log(`❌ endingVideo would NOT be sent to API:`, {
      inAllowedKeys: allowedAssetKeys.includes('endingVideo'),
      status: endingVideoAsset.status,
      hasUrl: !!endingVideoAsset.url
    });
  }
}

debugEndingVideoPayload().catch(console.error);
