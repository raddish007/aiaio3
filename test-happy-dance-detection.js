require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testHappyDanceDetection() {
  console.log('🔍 Testing Happy Dance asset detection logic...');
  
  const childName = 'Andrew';
  const targetLetter = 'A';
  const themeToUse = 'dogs'; // Note: should match "Dog" theme

  // Test the exact same query logic as the UI
  const { data: specificAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('metadata->>child_name', childName)
    .eq('metadata->>targetLetter', targetLetter);

  const { data: letterSpecificAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('metadata->>targetLetter', targetLetter)
    .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

  const { data: letterSpecificAudioAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'audio')
    .eq('metadata->>targetLetter', targetLetter)
    .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

  const { data: genericVideoAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'video')
    .or('metadata->>child_name.is.null,metadata->>child_name.eq.')
    .is('metadata->>targetLetter', null);

  console.log('\n📋 Asset Detection Results:');
  console.log(`Child-specific: ${specificAssets?.length || 0}`);
  console.log(`Letter-specific: ${letterSpecificAssets?.length || 0}`);
  console.log(`Letter-specific audio: ${letterSpecificAudioAssets?.length || 0}`);
  console.log(`Generic video: ${genericVideoAssets?.length || 0}`);

  // Combine and process like the UI does
  const existingAssets = [
    ...(specificAssets || []),
    ...(letterSpecificAssets || []),
    ...(letterSpecificAudioAssets || []),
    ...(genericVideoAssets || [])
  ];

  // Map assets by type (like the UI does)
  const existingByType = new Map();
  
  existingAssets.forEach(asset => {
    let assetKey = null;
    
    if (asset.type === 'video') {
      const section = asset.metadata?.section;
      const category = asset.metadata?.category;
      const videoType = asset.metadata?.videoType;
      
      // Happy dance video detection logic
      if (section === 'happyDanceVideo' || section === 'dance' || videoType === 'happyDanceVideo' || category === 'dance') {
        assetKey = 'happyDanceVideo';
        
        // Theme matching logic for videos
        const currentTheme = asset.metadata?.theme?.toLowerCase();
        const desiredTheme = themeToUse.toLowerCase();
        
        const normalizeTheme = (theme) => {
          const normalized = theme.toLowerCase();
          if (normalized === 'dogs' || normalized === 'dog') return 'dog';
          return normalized;
        };
        
        const normalizedCurrentTheme = normalizeTheme(currentTheme || '');
        const normalizedDesiredTheme = normalizeTheme(desiredTheme);
        
        console.log(`\n🎬 Happy Dance Video Found:`);
        console.log(`  ID: ${asset.id}`);
        console.log(`  Theme: ${currentTheme}`);
        console.log(`  Normalized current: ${normalizedCurrentTheme}`);
        console.log(`  Normalized desired: ${normalizedDesiredTheme}`);
        console.log(`  Theme match: ${normalizedCurrentTheme === normalizedDesiredTheme}`);
        
        if (normalizedCurrentTheme === normalizedDesiredTheme) {
          console.log(`  ✅ Theme matches! This asset should be detected.`);
        } else {
          console.log(`  ❌ Theme doesn't match. Asset won't be used.`);
        }
      }
    } else if (asset.type === 'audio') {
      const assetPurpose = asset.metadata?.assetPurpose;
      
      if (assetPurpose === 'happyDanceAudio') {
        assetKey = 'happyDanceAudio';
        
        console.log(`\n🎵 Happy Dance Audio Found:`);
        console.log(`  ID: ${asset.id}`);
        console.log(`  Target Letter: ${asset.metadata?.targetLetter}`);
        console.log(`  Letter match: ${asset.metadata?.targetLetter === targetLetter}`);
      }
    }
    
    if (assetKey) {
      existingByType.set(assetKey, asset);
    }
  });

  console.log(`\n🗂️ Final Asset Mapping:`);
  console.log(`  happyDanceVideo: ${existingByType.has('happyDanceVideo') ? 'FOUND' : 'MISSING'}`);
  console.log(`  happyDanceAudio: ${existingByType.has('happyDanceAudio') ? 'FOUND' : 'MISSING'}`);
}

testHappyDanceDetection().catch(console.error);
