const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCurrentDetection() {
  console.log('🔍 Testing current video asset detection logic...\n');
  
  const childName = 'Andrew';
  const targetLetter = 'A';
  const themeToUse = 'dogs';

  console.log(`📋 Test parameters: Child: ${childName}, Letter: ${targetLetter}, Theme: ${themeToUse}\n`);

  // Replicate the exact logic from letter-hunt-request.tsx
  
  // 1. Assets specific to this child and letter
  console.log('1️⃣ Checking for specific assets (child + letter)...');
  const { data: specificAssets, error: specificError } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('metadata->>child_name', childName)
    .eq('metadata->>targetLetter', targetLetter);

  console.log(`Found ${specificAssets?.length || 0} specific assets:`, specificAssets?.map(a => ({
    id: a.id,
    type: a.type,
    videoType: a.metadata?.videoType,
    section: a.metadata?.section,
    theme: a.metadata?.theme
  })));

  // 2. Letter Hunt video assets that match the target letter (regardless of child name)
  console.log('\n2️⃣ Checking for letter-specific video assets...');
  const { data: letterSpecificAssets, error: letterError } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'video')
    .eq('metadata->>targetLetter', targetLetter);

  console.log(`Found ${letterSpecificAssets?.length || 0} letter-specific video assets:`, letterSpecificAssets?.map(a => ({
    id: a.id,
    videoType: a.metadata?.videoType,
    section: a.metadata?.section,
    theme: a.metadata?.theme,
    child_name: a.metadata?.child_name
  })));

  // 3. Generic Letter Hunt video assets (not tied to specific child/letter)
  console.log('\n3️⃣ Checking for generic video assets...');
  const { data: genericVideoAssets, error: genericError } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'video')
    .is('metadata->>child_name', null)
    .is('metadata->>targetLetter', null);

  console.log(`Found ${genericVideoAssets?.length || 0} generic video assets:`, genericVideoAssets?.map(a => ({
    id: a.id,
    videoType: a.metadata?.videoType,
    section: a.metadata?.section,
    theme: a.metadata?.theme
  })));

  // Combine all sets of assets
  const existingAssets = [
    ...(specificAssets || []),
    ...(letterSpecificAssets || []),
    ...(genericVideoAssets || [])
  ];

  console.log(`\n📦 Total combined assets: ${existingAssets.length}`);

  // Test the asset mapping logic
  console.log('\n🔄 Testing asset mapping logic...');
  const existingByType = new Map();
  
  existingAssets?.forEach(asset => {
    let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
    
    // FALLBACK: For legacy video assets, try to infer from category or section
    if (!assetKey && asset.type === 'video') {
      const category = asset.metadata?.category;
      const section = asset.metadata?.section;
      
      // Handle direct section mappings first
      if (section === 'introVideo') {
        assetKey = 'introVideo';
      } else if (section === 'intro2Video') {
        assetKey = 'intro2Video';
      } else if (section === 'happyDanceVideo' || section === 'dance') {
        assetKey = 'happyDanceVideo';
      }
      // Handle legacy mappings
      else if (category === 'letter AND theme' || category === 'letter-and-theme' || section === 'intro') {
        assetKey = 'introVideo';
      } else if (section === 'search' || section === 'intro2') {
        assetKey = 'intro2Video';
      } else if (category === 'dance') {
        assetKey = 'happyDanceVideo';
      }
      
      if (assetKey) {
        console.log(`🔄 Legacy video: Inferred videoType: ${assetKey} from category: ${category}, section: ${section} for asset ${asset.id}`);
      }
    }
    
    if (assetKey) {
      // For video assets, also check if theme matches (prefer matching theme)
      const existingAsset = existingByType.get(assetKey);
      const shouldUseThisAsset = !existingAsset || 
        (asset.type === 'video' && asset.metadata?.theme?.toLowerCase() === themeToUse.toLowerCase());
      
      if (shouldUseThisAsset) {
        existingByType.set(assetKey, {
          url: asset.file_url,
          status: 'ready',
          assetId: asset.id,
          generatedAt: asset.created_at
        });
        console.log(`✅ Mapped asset: ${assetKey} (${asset.type}) - ${asset.file_url}${asset.metadata?.theme ? ` [Theme: ${asset.metadata.theme}]` : ''}`);
      } else {
        console.log(`⚠️ Skipping asset ${assetKey} - theme mismatch: ${asset.metadata?.theme} vs ${themeToUse}`);
      }
    } else {
      console.log(`⚠️ Asset missing key field:`, {
        id: asset.id,
        type: asset.type,
        imageType: asset.metadata?.imageType,
        assetPurpose: asset.metadata?.assetPurpose,
        videoType: asset.metadata?.videoType,
        category: asset.metadata?.category,
        section: asset.metadata?.section
      });
    }
  });

  console.log('\n🎯 Final asset mapping results:');
  for (const [key, value] of existingByType.entries()) {
    console.log(`  ${key}: ${value.status} (${value.assetId})`);
  }

  // Check specifically for introVideo
  const introVideoAsset = existingByType.get('introVideo');
  console.log('\n🎥 IntroVideo detection result:');
  if (introVideoAsset) {
    console.log(`✅ IntroVideo FOUND: ${introVideoAsset.assetId} - ${introVideoAsset.url}`);
  } else {
    console.log('❌ IntroVideo NOT FOUND');
  }
}

testCurrentDetection().catch(console.error);
