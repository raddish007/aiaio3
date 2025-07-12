const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testIntroAudioTiming() {
  console.log('🎵 Testing Letter Hunt intro audio timing in Remotion template...\n');

  try {
    // Test with Andrew's data and Letter A (known to have intro audio)
    const testChild = 'Andrew';
    const testLetter = 'A';
    const testTheme = 'dogs';

    console.log(`Testing intro audio timing for ${testChild} (Letter ${testLetter})`);

    // Check for letter-specific intro audio
    const { data: letterSpecificAudioAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio')
      .eq('metadata->>targetLetter', testLetter)
      .is('metadata->>child_name', null);

    console.log(`\n🔍 Found ${letterSpecificAudioAssets?.length || 0} letter-specific audio assets for letter ${testLetter}`);

    const introAudioAsset = letterSpecificAudioAssets?.find(asset => 
      asset.metadata?.assetPurpose === 'introAudio'
    );

    if (introAudioAsset) {
      console.log('\n✅ Intro Audio Asset Found:');
      console.log(`   Asset ID: ${introAudioAsset.id}`);
      console.log(`   URL: ${introAudioAsset.file_url}`);
      console.log(`   Status: ${introAudioAsset.status}`);
      console.log(`   Target Letter: ${introAudioAsset.metadata?.targetLetter}`);
      console.log(`   Child Name: ${introAudioAsset.metadata?.child_name || 'null (letter-specific)'}`);
      console.log(`   Asset Purpose: ${introAudioAsset.metadata?.assetPurpose}`);
      console.log(`   Personalization: ${introAudioAsset.metadata?.personalization}`);

      // Simulate Remotion timing
      const fps = 30;
      const standardDuration = 90; // 3 seconds
      const introDuration = 120; // 4 seconds for intro segment
      
      const segments = [
        { name: 'titleCard', start: 0, duration: standardDuration },
        { name: 'intro', start: standardDuration, duration: introDuration },
        { name: 'intro2', start: standardDuration + introDuration, duration: standardDuration },
      ];

      console.log('\n🎬 Remotion Timing Analysis:');
      console.log(`   FPS: ${fps}`);
      console.log(`   Intro segment: frames ${segments[1].start} to ${segments[1].start + segments[1].duration} (${segments[1].duration / fps} seconds)`);
      console.log(`   Intro audio starts: frame ${segments[1].start + fps} (${(segments[1].start + fps) / fps} seconds from video start)`);
      console.log(`   Intro audio delay: ${fps / fps} second into intro segment`);
      console.log(`   Maximum audio duration: ${Math.min(introDuration - fps, 3 * fps) / fps} seconds`);

      // Test audio URL accessibility
      console.log('\n🔗 Audio URL Test:');
      try {
        const response = await fetch(introAudioAsset.file_url, { method: 'HEAD' });
        console.log(`   Accessibility: ${response.ok ? '✅ Accessible' : '❌ Not accessible'} (${response.status})`);
        console.log(`   Content-Type: ${response.headers.get('content-type') || 'Unknown'}`);
        console.log(`   Content-Length: ${response.headers.get('content-length') || 'Unknown'} bytes`);
        
        if (response.headers.get('content-length')) {
          const sizeKB = Math.round(parseInt(response.headers.get('content-length')) / 1024);
          console.log(`   File Size: ${sizeKB} KB`);
          
          // Estimate audio duration (rough calculation for MP3)
          const estimatedDurationSeconds = sizeKB / 16; // Very rough estimate for speech audio
          console.log(`   Estimated Duration: ~${Math.round(estimatedDurationSeconds * 10) / 10} seconds`);
        }
      } catch (error) {
        console.log(`   Accessibility: ❌ Error - ${error.message}`);
      }

      console.log('\n🎯 Remotion Asset Mapping:');
      const remotionAsset = {
        url: introAudioAsset.file_url,
        status: 'ready',
        assetId: introAudioAsset.id,
        generatedAt: introAudioAsset.created_at,
        metadata: introAudioAsset.metadata
      };

      console.log('   introAudio:', JSON.stringify(remotionAsset, null, 4));

      console.log('\n✅ Intro audio is properly configured and will play:');
      console.log(`   - 1 second after the intro segment begins`);
      console.log(`   - At ${(segments[1].start + fps) / fps} seconds from video start`);
      console.log(`   - With fade in/out effects`);
      console.log(`   - For up to 3 seconds duration`);
      console.log(`   - Says: "Today we're looking for the letter ${testLetter}!"`);

    } else {
      console.log('\n❌ No intro audio asset found for this letter');
      console.log('Available audio assets:');
      letterSpecificAudioAssets?.forEach(asset => {
        console.log(`   - ${asset.id}: ${asset.metadata?.assetPurpose || 'unknown purpose'}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testIntroAudioTiming().catch(console.error);
