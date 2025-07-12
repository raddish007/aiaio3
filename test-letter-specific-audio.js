const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLetterSpecificAudio() {
  console.log('🎤 Testing Letter-Specific Audio Asset Flow...\n');

  try {
    const testLetter = 'A';
    
    console.log(`🔍 Checking for existing letter-specific audio assets for Letter ${testLetter}...`);

    // Query for letter-specific audio assets (no child_name, reusable)
    const { data: letterAudioAssets, error } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio')
      .eq('metadata->>targetLetter', testLetter)
      .is('metadata->>child_name', null);

    if (error) {
      console.error('❌ Error querying assets:', error);
      return;
    }

    console.log(`📦 Found ${letterAudioAssets?.length || 0} letter-specific audio assets for Letter ${testLetter}`);

    // Expected letter-specific audio assets
    const expectedAudioAssets = [
      { key: 'introAudio', script: `Today we're looking for the letter ${testLetter}!` },
      { key: 'intro2Audio', script: `Everywhere you go, look for the letter ${testLetter}!` },
      { key: 'signAudio', script: 'On signs' },
      { key: 'bookAudio', script: 'On books' },
      { key: 'groceryAudio', script: 'Even in the grocery store!' },
      { key: 'happyDanceAudio', script: 'And when you find your letter, I want you to do a little happy dance!' }
    ];

    console.log('\n🎯 Expected Letter-Specific Audio Assets:');
    expectedAudioAssets.forEach(asset => {
      console.log(`   📝 ${asset.key}: "${asset.script}"`);
    });

    if (letterAudioAssets && letterAudioAssets.length > 0) {
      console.log('\n✅ Found Letter-Specific Audio Assets:');
      
      for (const asset of letterAudioAssets) {
        const assetPurpose = asset.metadata?.assetPurpose;
        console.log(`\n   🎤 ${assetPurpose}:`);
        console.log(`      ID: ${asset.id}`);
        console.log(`      URL: ${asset.file_url}`);
        console.log(`      Status: ${asset.status}`);
        console.log(`      Target Letter: ${asset.metadata?.targetLetter}`);
        console.log(`      Child Name: ${asset.metadata?.child_name || 'N/A (reusable)'}`);
        console.log(`      Created: ${asset.created_at}`);
        
        // Test URL accessibility
        if (asset.file_url) {
          try {
            const response = await fetch(asset.file_url, { method: 'HEAD' });
            console.log(`      Accessibility: ${response.ok ? '✅ Accessible' : '❌ Not accessible'} (${response.status})`);
          } catch (fetchError) {
            console.log(`      Accessibility: ❌ Error - ${fetchError.message}`);
          }
        }
      }

      // Map existing assets by purpose
      const existingByPurpose = new Map();
      letterAudioAssets.forEach(asset => {
        if (asset.metadata?.assetPurpose) {
          existingByPurpose.set(asset.metadata.assetPurpose, asset);
        }
      });

      console.log('\n📊 Asset Coverage Report:');
      expectedAudioAssets.forEach(expected => {
        const exists = existingByPurpose.has(expected.key);
        const status = exists ? '✅ Found' : '❌ Missing';
        console.log(`   ${status} ${expected.key}`);
      });

    } else {
      console.log('\n❌ No letter-specific audio assets found for Letter A');
      console.log('\n💡 To generate these assets:');
      console.log('   1. Go to Letter Hunt admin page');
      console.log('   2. Select a child and Letter A');
      console.log('   3. Click "Generate Audio" for intro/search segments');
      console.log('   4. Assets will be saved without child_name for reusability');
    }

    // Test URL format for audio generation
    console.log('\n🔗 Example Audio Generation URL:');
    const sampleParams = new URLSearchParams({
      templateType: 'letter-hunt',
      assetPurpose: 'introAudio',
      targetLetter: testLetter,
      script: `Today we're looking for the letter ${testLetter}!`,
      voiceId: '248nvfaZe8BXhKntjmpp',
      speed: '1.0',
      assetKey: 'introAudio'
      // Note: No childName for letter-specific audio
    });
    
    console.log(`   /admin/audio-generator?${sampleParams.toString()}`);

    console.log('\n✅ Letter-specific audio test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLetterSpecificAudio().catch(console.error);
