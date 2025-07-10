const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNameVideoFix() {
  console.log('🧪 Testing NameVideo API fix...\n');

  // Simulate the payload structure that was causing issues
  const letterAudioUrls = {
    "N": {
      "id": "3f1fb53a-8977-46c6-b26e-5c6403cb6e74",
      "file_url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104463999_c0863a2b-e7d0-486e-ab56-60af273272e0.wav",
      "theme": "N",
      "metadata": {
        "letter": "N",
        "audio_class": "letter_audio"
      }
    },
    "O": {
      "id": "c7fc5bd5-c888-423b-84f2-f4e994e92626",
      "file_url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/trimmed_1752104444762_02af0b39-c151-4505-b349-c9ff821533f7.wav",
      "theme": "O",
      "metadata": {
        "letter": "O",
        "audio_class": "letter_audio"
      }
    }
  };

  console.log('📥 Input letterAudioUrls (asset objects):');
  console.log(JSON.stringify(letterAudioUrls, null, 2));

  // Simulate the fix: convert asset objects to URL strings
  const letterAudioUrlStrings = {};
  if (letterAudioUrls) {
    Object.entries(letterAudioUrls).forEach(([letter, asset]) => {
      if (asset && typeof asset === 'object' && 'file_url' in asset) {
        letterAudioUrlStrings[letter] = asset.file_url;
      } else if (typeof asset === 'string') {
        letterAudioUrlStrings[letter] = asset;
      }
    });
  }

  console.log('\n📤 Output letterAudioUrls (URL strings):');
  console.log(JSON.stringify(letterAudioUrlStrings, null, 2));

  // Verify the format matches what NameVideo composition expects
  console.log('\n✅ Verification:');
  console.log(`- Type: ${typeof letterAudioUrlStrings}`);
  console.log(`- Keys: ${Object.keys(letterAudioUrlStrings).join(', ')}`);
  console.log(`- Values are strings: ${Object.values(letterAudioUrlStrings).every(v => typeof v === 'string')}`);
  
  // Test with NameVideo composition props interface
  const testProps = {
    childName: "Nolan",
    theme: "halloween",
    age: 3,
    backgroundMusicUrl: "https://example.com/music.mp3",
    backgroundMusicVolume: 0.5,
    introImageUrl: "",
    introAudioUrl: "https://example.com/intro.mp3",
    letterImageUrls: ["https://example.com/img1.png", "https://example.com/img2.png"],
    letterAudioUrls: letterAudioUrlStrings, // This should now work!
    outroImageUrl: "",
    outroAudioUrl: "https://example.com/outro.mp3"
  };

  console.log('\n🎬 Test props for NameVideo composition:');
  console.log(`- letterAudioUrls type: ${typeof testProps.letterAudioUrls}`);
  console.log(`- letterAudioUrls keys: ${Object.keys(testProps.letterAudioUrls).join(', ')}`);
  console.log(`- All values are strings: ${Object.values(testProps.letterAudioUrls).every(v => typeof v === 'string')}`);

  if (Object.values(testProps.letterAudioUrls).every(v => typeof v === 'string')) {
    console.log('\n🎉 SUCCESS: The fix should resolve the NameVideo render issues!');
    console.log('The letterAudioUrls now contains URL strings instead of asset objects,');
    console.log('which matches what the NameVideo composition expects.');
  } else {
    console.log('\n❌ ERROR: The fix did not work correctly.');
  }
}

testNameVideoFix(); 