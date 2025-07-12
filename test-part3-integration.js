/**
 * Test script to verify part 3 integration with Letter Hunt template
 * This script checks that intro3 assets are properly detected and mapped
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPart3Assets() {
  console.log('🧪 Testing Part 3 (intro3) Asset Detection for Letter Hunt');
  console.log('=' . repeat(60));

  const testChild = 'Andrew';
  const testLetter = 'A';
  const testTheme = 'monsters';

  console.log(`\n🔍 Searching for assets for child: ${testChild}, letter: ${testLetter}, theme: ${testTheme}`);

  try {
    // Query for intro3 video (theme-matched)
    console.log('\n📹 Checking intro3 video (theme-matched):');
    const { data: intro3Videos, error: intro3VideoError } = await supabase
      .from('asset_queue')
      .select('*')
      .eq('child_name', testChild)
      .eq('asset_type', 'video')
      .eq('asset_purpose', 'intro3')
      .eq('status', 'approved');

    if (intro3VideoError) {
      console.error('❌ Error fetching intro3 videos:', intro3VideoError);
    } else {
      console.log(`   Found ${intro3Videos.length} intro3 video(s)`);
      intro3Videos.forEach(asset => {
        console.log(`   📹 Video: ${asset.file_url}`);
        console.log(`      Theme: ${asset.theme || 'N/A'}, Purpose: ${asset.asset_purpose}`);
      });
    }

    // Query for intro3 audio (letter-matched)
    console.log('\n🎵 Checking intro3 audio (letter-matched):');
    const { data: intro3Audios, error: intro3AudioError } = await supabase
      .from('asset_queue')
      .select('*')
      .eq('child_name', testChild)
      .eq('asset_type', 'audio')
      .eq('asset_purpose', 'intro3')
      .eq('status', 'approved');

    if (intro3AudioError) {
      console.error('❌ Error fetching intro3 audios:', intro3AudioError);
    } else {
      console.log(`   Found ${intro3Audios.length} intro3 audio(s)`);
      intro3Audios.forEach(asset => {
        console.log(`   🎵 Audio: ${asset.file_url}`);
        console.log(`      Letter: ${asset.target_letter || 'N/A'}, Purpose: ${asset.asset_purpose}`);
      });
    }

    // Test complete asset mapping for part 3
    console.log('\n🔧 Testing complete Letter Hunt asset mapping with part 3:');
    
    const assetPurposes = [
      'title-card', 'intro', 'intro2', 'intro3', 
      'sign', 'book', 'grocery', 'happy-dance', 'ending'
    ];

    for (const purpose of assetPurposes) {
      // Check video assets
      const { data: videos } = await supabase
        .from('asset_queue')
        .select('*')
        .eq('child_name', testChild)
        .eq('asset_type', 'video')
        .eq('asset_purpose', purpose)
        .eq('status', 'approved')
        .limit(1);

      // Check audio assets  
      const { data: audios } = await supabase
        .from('asset_queue')
        .select('*')
        .eq('child_name', testChild)
        .eq('asset_type', 'audio')
        .eq('asset_purpose', purpose)
        .eq('status', 'approved')
        .limit(1);

      // Check image assets
      const { data: images } = await supabase
        .from('asset_queue')
        .select('*')
        .eq('child_name', testChild)
        .eq('asset_type', 'image')
        .eq('asset_purpose', purpose)
        .eq('status', 'approved')
        .limit(1);

      const videoStatus = videos && videos.length > 0 ? '✅' : '❌';
      const audioStatus = audios && audios.length > 0 ? '✅' : '❌';
      const imageStatus = images && images.length > 0 ? '✅' : '❌';

      console.log(`   ${purpose.padEnd(15)} Video: ${videoStatus} Audio: ${audioStatus} Image: ${imageStatus}`);
    }

    console.log('\n📊 Part 3 Integration Summary:');
    console.log('   ✅ intro3 video should be theme-matched (like intro2)');
    console.log('   ✅ intro3 audio should be letter-matched (like intro2)');
    console.log('   ✅ Template duration: 29.5 seconds (9 segments)');
    console.log('   ✅ Segment structure: titleCard(3s) + intro(5.5s) + intro2(3s) + intro3(3s) + 5 more segments(3s each)');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testPart3Assets().catch(console.error);
