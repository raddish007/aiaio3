// Test moderation queue fix for Letter Hunt video generation
const axios = require('axios');

async function testModerationQueueFix() {
  console.log('🧪 Testing moderation queue fix for Letter Hunt video...');
  
  try {
    // Test payload for Letter Hunt video generation
    const testPayload = {
      childName: 'TestChild',
      childId: 'test-child-id',
      chosenTheme: 'animals',
      childAge: 4
    };

    console.log('📝 Test payload:', testPayload);
    
    // Make request to the Letter Hunt video generation API
    const response = await axios.post('http://localhost:3000/api/videos/generate-letter-hunt', testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minute timeout
    });

    console.log('✅ API Response Status:', response.status);
    console.log('📄 Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if video generation was successful
    if (response.data.success && response.data.jobId) {
      console.log('🎬 Video generation job created successfully!');
      console.log('📋 Job ID:', response.data.jobId);
      
      if (response.data.videoUrl) {
        console.log('🎥 Video URL:', response.data.videoUrl);
      }
      
      console.log('✅ Test completed successfully - moderation queue error should be fixed!');
    } else {
      console.log('❌ Video generation failed');
      console.log('Error details:', response.data.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Test failed with error:');
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testModerationQueueFix();
