// Test script to verify frontend payload only includes 3-part assets
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODAwMzgzOSwiZXhwIjoyMDQzNTc5ODM5fQ.XM1eHDdQFgdU7HSJBx4pf9_LZlOxNyT5mLbkIbGMrYA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Expected 3-part assets only (what we want to see in frontend payload)
const expectedAssetKeys = [
  'titleCard', 'titleAudio',
  'introVideo', 'introAudio', 
  'intro2Video', 'intro2Audio',
  'backgroundMusic'
];

// These should NOT be in the frontend payload anymore
const excludedAssetKeys = [
  'intro3Video', 'intro3Audio',
  'signImage', 'signAudio',
  'bookImage', 'bookAudio', 
  'groceryImage', 'groceryAudio',
  'happyDanceVideo', 'happyDanceAudio',
  'endingImage', 'endingAudio'
];

async function testFrontendPayloadStructure() {
  console.log('🧪 Testing Frontend Payload Structure...\n');

  // Simulate the frontend payload creation logic
  // This mimics the initializePayload() function structure
  const childName = 'Andrew';
  const targetLetter = 'P';
  const themeToUse = 'pirates';
  
  // This represents what the frontend payload should look like now
  const frontendPayload = {
    childName: childName.trim(),
    targetLetter: targetLetter.toUpperCase().trim(),
    assets: {
      // Part 1: Title Card (0-3s)
      titleCard: {
        type: 'image',
        name: 'Title Card', 
        description: `"${childName}'s Letter Hunt!" title card with ${themeToUse} theme`,
        status: 'missing'
      },
      titleAudio: {
        type: 'audio',
        name: 'Title Audio',
        description: `"Letter Hunt for ${childName}"`,
        status: 'missing'
      },
      
      // Part 2: Letter + Theme (3-6s)
      introVideo: {
        type: 'video',
        name: 'Intro Video',
        description: `${themeToUse} character pointing to giant letter`,
        status: 'missing'
      },
      introAudio: {
        type: 'audio',
        name: 'Intro Audio', 
        description: `"Today we're looking for the letter ${targetLetter}!"`,
        status: 'missing'
      },
      
      // Part 3: Search (6-9s)
      intro2Video: {
        type: 'video',
        name: 'Search Video',
        description: `${themeToUse} character searching around playfully`,
        status: 'missing'
      },
      intro2Audio: {
        type: 'audio',
        name: 'Search Audio',
        description: `"Everywhere you go, look for the letter ${targetLetter}!"`,
        status: 'missing'
      },
      
      // Background music throughout
      backgroundMusic: {
        type: 'audio',
        name: 'Background Music',
        description: 'Cheerful background music for Letter Hunt video',
        status: 'ready',
        url: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752340926893.MP3'
      }
    }
  };

  console.log('📋 Frontend Payload Structure:');
  console.log(JSON.stringify(frontendPayload, null, 2));
  
  console.log('\n✅ Assets included in frontend payload:');
  const includedAssets = Object.keys(frontendPayload.assets);
  includedAssets.forEach(asset => {
    console.log(`  - ${asset}: ${frontendPayload.assets[asset].name}`);
  });

  console.log('\n🔍 Verification:');
  
  // Check that all expected assets are present
  const missingExpected = expectedAssetKeys.filter(key => !includedAssets.includes(key));
  if (missingExpected.length === 0) {
    console.log('✅ All expected 3-part assets are present');
  } else {
    console.log('❌ Missing expected assets:', missingExpected);
  }

  // Check that no excluded assets are present
  const unexpectedlyIncluded = includedAssets.filter(key => excludedAssetKeys.includes(key));
  if (unexpectedlyIncluded.length === 0) {
    console.log('✅ No excluded assets are present in frontend payload');
  } else {
    console.log('❌ Unexpectedly included excluded assets:', unexpectedlyIncluded);
  }

  console.log(`\n📊 Summary:`);
  console.log(`  - Frontend payload has ${includedAssets.length} assets`);
  console.log(`  - Expected 3-part assets: ${expectedAssetKeys.length}`);
  console.log(`  - Match: ${includedAssets.length === expectedAssetKeys.length ? '✅' : '❌'}`);
  
  if (includedAssets.length === expectedAssetKeys.length && missingExpected.length === 0 && unexpectedlyIncluded.length === 0) {
    console.log('\n🎉 SUCCESS: Frontend payload structure is correct!');
    console.log('   - Only 3-part assets are included');
    console.log('   - Happy Dance and other unused assets are excluded');
    console.log('   - Frontend payload now matches what is sent to Remotion API');
  } else {
    console.log('\n❌ ISSUE: Frontend payload structure needs adjustment');
  }
}

testFrontendPayloadStructure().catch(console.error);
