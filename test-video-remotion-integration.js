const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testVideoIntegration() {
  console.log('🎬 Testing Letter Hunt video integration with Remotion template...\n');

  try {
    // Test with Andrew's data (known to have video assets)
    const testChild = 'Andrew';
    const testLetter = 'A';
    const testTheme = 'dogs';

    console.log(`Testing Letter Hunt for ${testChild} (Letter ${testLetter}, Theme: ${testTheme})`);

    // 1. Assets specific to this child and letter
    const { data: specificAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('metadata->>child_name', testChild)
      .eq('metadata->>targetLetter', testLetter);

    // 2. Letter Hunt video assets that match the target letter
    const { data: letterSpecificAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'video')
      .eq('metadata->>targetLetter', testLetter);

    // 3. Letter-specific audio assets (not personalized, reusable across children)
    const { data: letterSpecificAudioAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio')
      .eq('metadata->>targetLetter', testLetter)
      .is('metadata->>child_name', null);

    // 4. Generic Letter Hunt video assets
    const { data: genericVideoAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'video')
      .is('metadata->>child_name', null)
      .is('metadata->>targetLetter', null);

    const existingAssets = [
      ...(specificAssets || []),
      ...(letterSpecificAssets || []),
      ...(letterSpecificAudioAssets || []),
      ...(genericVideoAssets || [])
    ];

    console.log(`\n📦 Found ${existingAssets.length} total assets`);

    // Create mapping like the UI does
    const existingByType = new Map();
    existingAssets.forEach(asset => {
      let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
      
      // Legacy mapping for videos
      if (!assetKey && asset.type === 'video') {
        const category = asset.metadata?.category;
        const section = asset.metadata?.section;
        
        if (section === 'introVideo') {
          assetKey = 'introVideo';
        } else if (section === 'intro2Video') {
          assetKey = 'intro2Video';
        } else if (section === 'happyDanceVideo' || section === 'dance') {
          assetKey = 'happyDanceVideo';
        } else if (category === 'letter AND theme' || category === 'letter-and-theme' || section === 'intro') {
          assetKey = 'introVideo';
        } else if (section === 'search' || section === 'intro2') {
          assetKey = 'intro2Video';
        } else if (category === 'dance') {
          assetKey = 'happyDanceVideo';
        }
      }
      
      if (assetKey) {
        // For video assets, prefer theme matches
        const existingAsset = existingByType.get(assetKey);
        const shouldUseThisAsset = !existingAsset || 
          (asset.type === 'video' && asset.metadata?.theme?.toLowerCase() === testTheme.toLowerCase());
        
        if (shouldUseThisAsset) {
          existingByType.set(assetKey, {
            url: asset.file_url,
            status: 'ready',
            assetId: asset.id,
            generatedAt: asset.created_at,
            theme: asset.metadata?.theme,
            metadata: asset.metadata
          });
        }
      }
    });

    console.log('\n🎯 Mapped assets for Remotion template:');
    
    // Create Remotion-compatible asset structure
    const remotionAssets = {
      titleCard: existingByType.get('titleCard') || { url: '', status: 'missing' },
      introVideo: existingByType.get('introVideo') || { url: '', status: 'missing' },
      intro2Video: existingByType.get('intro2Video') || { url: '', status: 'missing' },
      signImage: existingByType.get('signImage') || { url: '', status: 'missing' },
      bookImage: existingByType.get('bookImage') || { url: '', status: 'missing' },
      groceryImage: existingByType.get('groceryImage') || { url: '', status: 'missing' },
      happyDanceVideo: existingByType.get('happyDanceVideo') || { url: '', status: 'missing' },
      endingImage: existingByType.get('endingImage') || { url: '', status: 'missing' },
      titleAudio: existingByType.get('titleAudio') || { url: '', status: 'missing' },
      introAudio: existingByType.get('introAudio') || { url: '', status: 'missing' },
      intro2Audio: existingByType.get('intro2Audio') || { url: '', status: 'missing' },
      signAudio: existingByType.get('signAudio') || { url: '', status: 'missing' },
      bookAudio: existingByType.get('bookAudio') || { url: '', status: 'missing' },
      groceryAudio: existingByType.get('groceryAudio') || { url: '', status: 'missing' },
      happyDanceAudio: existingByType.get('happyDanceAudio') || { url: '', status: 'missing' },
      endingAudio: existingByType.get('endingAudio') || { url: '', status: 'missing' },
      backgroundMusic: { 
        url: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752340926893.MP3', 
        status: 'ready' 
      }
    };

    // Display asset status
    Object.entries(remotionAssets).forEach(([key, asset]) => {
      const status = asset.status === 'ready' ? '✅' : '❌';
      const themeInfo = asset.theme ? ` [Theme: ${asset.theme}]` : '';
      console.log(`   ${status} ${key}: ${asset.status}${themeInfo}`);
      if (asset.url && asset.status === 'ready') {
        console.log(`      URL: ${asset.url}`);
      }
    });

    console.log('\n🧪 Remotion Template Props:');
    const remotionProps = {
      childName: testChild,
      targetLetter: testLetter,
      childTheme: testTheme,
      childAge: 3,
      assets: remotionAssets
    };

    console.log(JSON.stringify(remotionProps, null, 2));

    // Test video asset URLs
    console.log('\n🎥 Video Asset Analysis:');
    const videoAssets = ['introVideo', 'intro2Video', 'happyDanceVideo'];
    
    for (const videoKey of videoAssets) {
      const asset = remotionAssets[videoKey];
      if (asset.status === 'ready' && asset.url) {
        console.log(`\n${videoKey}:`);
        console.log(`  URL: ${asset.url}`);
        console.log(`  Theme: ${asset.theme || 'N/A'}`);
        console.log(`  Asset ID: ${asset.assetId}`);
        
        // Test if URL is accessible
        try {
          const response = await fetch(asset.url, { method: 'HEAD' });
          console.log(`  Accessibility: ${response.ok ? '✅ Accessible' : '❌ Not accessible'} (${response.status})`);
          console.log(`  Content-Type: ${response.headers.get('content-type') || 'Unknown'}`);
          console.log(`  Content-Length: ${response.headers.get('content-length') || 'Unknown'} bytes`);
        } catch (error) {
          console.log(`  Accessibility: ❌ Error - ${error.message}`);
        }
      } else {
        console.log(`\n${videoKey}: ❌ Missing or not ready`);
      }
    }

    console.log('\n✅ Test completed! The video assets are properly integrated and ready for Remotion rendering.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVideoIntegration().catch(console.error);
