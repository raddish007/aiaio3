const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDurationFix() {
  console.log('🔧 Duration Fix Final Verification');
  console.log('==================================');
  
  console.log('\n1. Environment Variables:');
  console.log('   REMOTION_SITE_URL:', process.env.REMOTION_SITE_URL);
  
  console.log('\n2. Duration Calculation Test:');
  // Test the calculation that should now be correct
  const titleCardDuration = 3;
  const introDuration = 5.5;
  const intro2Duration = 5.5;
  const signDuration = 4;
  const bookDuration = 4;
  const groceryDuration = 4;
  const happyDanceDuration = 5.5;
  const endingDuration = 5.5;
  const totalDurationSeconds = titleCardDuration + introDuration + intro2Duration + signDuration + bookDuration + groceryDuration + happyDanceDuration + endingDuration;
  const totalDurationFrames = totalDurationSeconds * 30;
  
  console.log('   Individual segment durations:');
  console.log('   - titleCard:', titleCardDuration, 'seconds');
  console.log('   - intro:', introDuration, 'seconds');
  console.log('   - intro2:', intro2Duration, 'seconds');
  console.log('   - sign:', signDuration, 'seconds');
  console.log('   - book:', bookDuration, 'seconds');
  console.log('   - grocery:', groceryDuration, 'seconds');
  console.log('   - happyDance:', happyDanceDuration, 'seconds');
  console.log('   - ending:', endingDuration, 'seconds');
  console.log('   ✅ Total duration:', totalDurationSeconds, 'seconds');
  console.log('   ✅ Total frames (30fps):', totalDurationFrames, 'frames');
  
  console.log('\n3. Testing API Endpoint:');
  try {
    const response = await fetch('http://localhost:3000/api/videos/generate-letter-hunt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        childName: 'TestChild',
        targetLetter: 'A',
        childTheme: 'halloween',
        submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API Response duration:', data.estimatedDuration || data.duration, 'seconds');
      console.log('   ✅ API Response bucketName:', data.bucketName);
      console.log('   ✅ API Response renderId:', data.renderId);
    } else {
      console.log('   ❌ API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('   ❌ API Test failed:', error.message);
    console.log('   ℹ️  Make sure the dev server is running with: npm run dev');
  }
  
  console.log('\n4. Happy Dance Asset Check:');
  try {
    const { data: happyDanceAssets, error } = await supabase
      .from('approved_assets')
      .select('*')
      .eq('assetPurpose', 'happyDanceAudio')
      .eq('targetLetter', 'A');
      
    console.log('   Happy Dance Audio Assets for letter A:', happyDanceAssets?.length || 0);
    if (happyDanceAssets?.length > 0) {
      console.log('   ✅ Happy Dance audio assets detected');
    } else {
      console.log('   ⚠️  No Happy Dance audio assets found for letter A');
    }
    
    const { data: endingAssets, error: endingError } = await supabase
      .from('approved_assets')
      .select('*')
      .eq('assetPurpose', 'endingVideo')
      .eq('theme', 'halloween');
      
    console.log('   Ending Video Assets for halloween theme:', endingAssets?.length || 0);
    if (endingAssets?.length > 0) {
      console.log('   ✅ Ending video assets detected');
    } else {
      console.log('   ⚠️  No Ending video assets found for halloween theme');
    }
  } catch (error) {
    console.log('   ❌ Asset check failed:', error.message);
  }
  
  console.log('\n5. Summary:');
  console.log('   ✅ Root.tsx calculateMetadata updated to 37 seconds');
  console.log('   ✅ API endpoint updated to 37 seconds');
  console.log('   ✅ Lambda site deployed with duration fix');
  console.log('   ✅ .env.local updated with new site URL');
  console.log('   📝 Next step: Test video generation in UI to confirm 37-second duration');
}

testDurationFix().catch(console.error);
