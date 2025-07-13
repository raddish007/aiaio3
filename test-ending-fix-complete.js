const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function testEndingVideoDetectionFix() {
  console.log('🧪 Testing ending video detection fix...');
  
  // Test with Letter A
  const targetLetter = 'A';
  
  console.log(`\n🔍 Checking ending videos for Letter ${targetLetter}:`);
  
  // Get all letter hunt assets (same query as the frontend would use)
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

  console.log(`📦 Found ${existingAssets.length} total Letter Hunt assets for Letter ${targetLetter}`);

  // Simulate the frontend detection logic
  const existingByType = new Map();
  existingAssets?.forEach(asset => {
    let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
    
    if (assetKey) {
      const existingAsset = existingByType.get(assetKey);
      let shouldUseThisAsset = false;
      
      if (asset.type === 'video') {
        // Special handling for ending videos - they only need to match the target letter
        if (assetKey === 'endingVideo') {
          const assetTargetLetter = asset.metadata?.targetLetter;
          if (assetTargetLetter === targetLetter) {
            console.log(`✅ Found ending video for Letter ${targetLetter}: ${asset.id}`);
            shouldUseThisAsset = true;
          } else {
            console.log(`❌ Ending video letter mismatch: ${assetTargetLetter} !== ${targetLetter}`);
          }
        } else {
          // For other videos, still use theme matching logic
          console.log(`🎥 Other video type ${assetKey}: using theme matching logic`);
          shouldUseThisAsset = true; // Simplified for this test
        }
      } else {
        // Non-video assets
        shouldUseThisAsset = true;
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
        console.log(`✅ Using asset: ${assetKey} (${asset.type}) - ${asset.id}`);
      }
    }
  });

  console.log(`\n📋 Final asset detection results:`);
  console.log(`endingVideo status: ${existingByType.has('endingVideo') ? 'ready' : 'missing'}`);
  
  if (existingByType.has('endingVideo')) {
    const endingVideo = existingByType.get('endingVideo');
    console.log(`✅ Ending Video Details:`);
    console.log(`  - Asset ID: ${endingVideo.assetId}`);
    console.log(`  - URL: ${endingVideo.url}`);
    console.log(`  - Theme: ${endingVideo.theme}`);
    console.log(`  - Target Letter: ${endingVideo.targetLetter}`);
  } else {
    console.log(`❌ No ending video detected for Letter ${targetLetter}`);
  }

  // Test multiple letters to ensure they all work
  console.log('\n🔄 Testing ending video detection for all letters A-E...');
  
  for (const letter of ['A', 'B', 'C', 'D', 'E']) {
    const { data: letterAssets } = await supabase
      .from('assets')
      .select('id, metadata, tags, theme')
      .eq('status', 'approved')
      .contains('tags', ['ending'])
      .eq('theme', `Letter ${letter}`);

    const endingVideos = letterAssets?.filter(asset => 
      asset.metadata?.videoType === 'endingVideo'
    ) || [];

    if (endingVideos.length > 0) {
      console.log(`✅ Letter ${letter}: ${endingVideos.length} ending video(s) - ${endingVideos[0].id}`);
    } else {
      console.log(`❌ Letter ${letter}: No ending videos found`);
    }
  }

  console.log('\n🎉 Ending video detection test complete!');
}

testEndingVideoDetectionFix().catch(console.error);
