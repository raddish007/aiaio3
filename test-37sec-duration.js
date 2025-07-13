#!/usr/bin/env node

console.log('🧪 Testing Letter Hunt Duration with New Lambda Site');
console.log('=====================================================');

const fetch = require('node-fetch');

async function testDuration() {
  try {
    console.log('📡 Testing Letter Hunt generation...');
    
    // Test payload
    const testPayload = {
      childName: 'TestChild',
      targetLetter: 'T',
      childTheme: 'monsters',
      childAge: 3,
      assets: {
        titleCard: { url: '', status: 'missing' },
        introVideo: { url: '', status: 'missing' },
        intro2Video: { url: '', status: 'missing' },
        signImage: { url: '', status: 'missing' },
        bookImage: { url: '', status: 'missing' },
        groceryImage: { url: '', status: 'missing' },
        happyDanceVideo: { url: '', status: 'missing' },
        endingImage: { url: '', status: 'missing' },
        endingVideo: { url: '', status: 'missing' },
        titleAudio: { url: '', status: 'missing' },
        introAudio: { url: '', status: 'missing' },
        intro2Audio: { url: '', status: 'missing' },
        signAudio: { url: '', status: 'missing' },
        bookAudio: { url: '', status: 'missing' },
        groceryAudio: { url: '', status: 'missing' },
        happyDanceAudio: { url: '', status: 'missing' },
        endingAudio: { url: '', status: 'missing' },
        backgroundMusic: { url: '', status: 'missing' }
      }
    };

    const response = await fetch('http://localhost:3000/api/videos/generate-letter-hunt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Letter Hunt generation started successfully');
      console.log('🎬 Render ID:', result.renderId);
      console.log('🔗 Video URL:', result.url);
      
      console.log('\n⏰ Expected Duration: 37 seconds (1110 frames)');
      console.log('   - Wait for render to complete, then check actual duration');
      console.log('   - If still 29 seconds, there may be a deeper caching issue');
    } else {
      console.log('❌ Letter Hunt generation failed');
      console.log('Response:', await response.text());
    }

  } catch (error) {
    console.error('❌ Error testing duration:', error);
    console.log('\n💡 Alternative test:');
    console.log('   Try generating a Letter Hunt video through the UI');
    console.log('   Check the actual video duration when it completes');
  }
}

console.log('🚀 Lambda Site URL being used:');
console.log('   https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/sites/letter-hunt-37sec-1752376428/index.html');
console.log('\n✅ Changes Made:');
console.log('   • Root.tsx: 1110 frames (37 seconds)');
console.log('   • LetterHunt.tsx: Happy Dance & Ending = 5.5s each');
console.log('   • Fresh Lambda deployment with unique timestamp');
console.log('   • .env.local updated with new site URL');

// Comment out the actual API test since it requires the server to be running
// testDuration();

console.log('\n🎯 Next Steps:');
console.log('   1. Start the dev server: npm run dev');
console.log('   2. Go to Letter Hunt admin page');
console.log('   3. Generate a test video');
console.log('   4. Verify the final video is 37 seconds long');
