const fetch = require('node-fetch');

// Test audio generation for Letter Hunt
const testLetterHuntAudio = async () => {
  try {
    console.log('🎤 Testing Letter Hunt audio generation...');
    
    const testAudio = {
      script: "Alice's letter hunt!",
      voiceId: '248nvfaZe8BXhKntjmpp', // Murph voice
      speed: 1.0,
      isPersonalized: true,
      templateContext: {
        templateType: 'letter-hunt',
        assetPurpose: 'titleAudio',
        childName: 'Alice',
        targetLetter: 'A'
      }
    };
    
    console.log('📋 Request payload:', JSON.stringify(testAudio, null, 2));
    
    const response = await fetch('http://localhost:3004/api/assets/generate-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAudio),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Audio generation successful!');
      console.log('📄 Result:', {
        assetId: result.asset.id,
        fileUrl: result.asset.file_url,
        audioSize: result.generationInfo.audioSize,
        voiceId: result.generationInfo.voiceId
      });
    } else {
      console.log('❌ Audio generation failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testLetterHuntAudio();
