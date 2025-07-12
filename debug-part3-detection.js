const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugPart3Detection() {
  console.log('\n=== DEBUGGING PART 3 VIDEO DETECTION ===\n');
  
  // Test with Dogs theme (which should match the search video)
  const themeToUse = 'dogs';
  console.log(`Testing with theme: "${themeToUse}"`);
  
  // Get the search video assets
  const { data: assets, error } = await supabase
    .from('assets')
    .select('*')
    .eq('type', 'video')
    .in('status', ['approved', 'pending'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\nFound ${assets.length} video assets. Checking detection logic:\n`);
  
  // Simulate the detection logic from the Letter Hunt request page
  const existingByType = new Map();
  
  assets.forEach(asset => {
    // First check for videoType
    let assetKey = asset.metadata?.videoType;
    
    if (!assetKey && asset.type === 'video') {
      const category = asset.metadata?.category;
      const section = asset.metadata?.section;
      
      console.log(`Asset ${asset.id}:`, {
        theme: asset.metadata?.theme,
        category,
        section,
        videoType: asset.metadata?.videoType
      });
      
      // Handle specific asset ID mappings for known videos
      // Letter + Theme videos (introVideo)
      if (asset.id === 'eb3fcec0-d9a4-421d-a2fa-1bded854365d' || // Halloween + Letter N
          asset.id === '540dc1d4-f8c6-4c71-9b80-5d9f6964e9db' || // Dinosaurs + Letter L
          asset.id === 'c0793472-2eb4-4dab-aaec-c28689391077') {   // Dogs + Letter A
        assetKey = 'introVideo';
        console.log(`  → Mapped to introVideo (letter+theme)`);
      }
      // Search videos (intro2Video)
      else if (asset.id === 'c39cf5dc-dc21-4057-84d6-7ac059e1ee96' || // Dinosaurs search
               asset.id === '9b211a49-820f-477a-9512-322795762221' || // Dog search
               asset.id === 'b4bb12bd-f2a3-4035-9d38-6fca03b9c8dc') {   // Halloween search
        assetKey = 'intro2Video';
        console.log(`  → Mapped to intro2Video (search)`);
      }
      // Handle direct section mappings for future uploads
      else if (section === 'introVideo') {
        assetKey = 'introVideo';
        console.log(`  → Mapped to introVideo (section)`);
      } else if (section === 'intro2Video') {
        assetKey = 'intro2Video';
        console.log(`  → Mapped to intro2Video (section)`);
      } else if (section === 'intro3Video') {
        assetKey = 'intro3Video';
        console.log(`  → Mapped to intro3Video (section)`);
      } else if (section === 'happyDanceVideo' || section === 'dance') {
        assetKey = 'happyDanceVideo';
        console.log(`  → Mapped to happyDanceVideo (section)`);
      }
      // Handle legacy mappings
      else if (category === 'letter AND theme' || category === 'letter-and-theme' || section === 'intro') {
        assetKey = 'introVideo';
        console.log(`  → Mapped to introVideo (legacy)`);
      } else if (section === 'search' || section === 'intro2' || category === 'thematic') {
        assetKey = 'intro2Video';
        console.log(`  → Mapped to intro2Video (legacy)`);
      } else if (section === 'adventure' || section === 'intro3') {
        assetKey = 'intro3Video';
        console.log(`  → Mapped to intro3Video (legacy)`);
      } else if (category === 'dance') {
        assetKey = 'happyDanceVideo';
        console.log(`  → Mapped to happyDanceVideo (legacy)`);
      } else {
        console.log(`  → No mapping found`);
      }
    }
    
    if (assetKey) {
      // Check theme matching
      const existingAsset = existingByType.get(assetKey);
      const shouldUseThisAsset = !existingAsset || 
        (asset.type === 'video' && asset.metadata?.theme?.toLowerCase() === themeToUse.toLowerCase());
      
      console.log(`  Theme check: asset.theme="${asset.metadata?.theme}" vs target="${themeToUse}" → shouldUse: ${shouldUseThisAsset}`);
      
      if (shouldUseThisAsset) {
        existingByType.set(assetKey, {
          url: asset.file_url,
          status: 'ready',
          assetId: asset.id,
          generatedAt: asset.created_at
        });
        console.log(`  ✅ Using this asset for ${assetKey}`);
      } else {
        console.log(`  ⚠️ Skipping due to theme mismatch`);
      }
    }
    console.log('');
  });
  
  console.log('\n=== FINAL MAPPING RESULTS ===');
  console.log(`introVideo: ${existingByType.has('introVideo') ? '✅ Found' : '❌ Missing'}`);
  console.log(`intro2Video: ${existingByType.has('intro2Video') ? '✅ Found' : '❌ Missing'}`);
  console.log(`intro3Video: ${existingByType.has('intro3Video') ? '✅ Found' : '❌ Missing'}`);
  console.log(`happyDanceVideo: ${existingByType.has('happyDanceVideo') ? '✅ Found' : '❌ Missing'}`);
  
  if (existingByType.has('intro2Video')) {
    const asset = existingByType.get('intro2Video');
    console.log(`\nintro2Video details: Asset ID ${asset.assetId}`);
  }
}

debugPart3Detection().catch(console.error);
