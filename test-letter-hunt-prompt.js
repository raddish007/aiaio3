// Test script to verify Letter Hunt prompt generation
const fetch = require('node-fetch');

async function testLetterHuntPrompt() {
  try {
    console.log('🧪 Testing Letter Hunt prompt generation...');
    
    const requestBody = {
      childName: 'Emma',
      theme: 'animals',
      ageRange: '3-5',
      template: 'letter-hunt',
      personalization: 'personalized',
      safeZones: ['center_safe'],
      promptCount: 2,
      aspectRatio: '16:9',
      artStyle: '2D Pixar Style',
      additionalContext: 'Target letter: E'
    };
    
    console.log('📋 Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('http://localhost:3001/api/prompts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error! Status:', response.status);
      console.log('Error details:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error);
  }
}

testLetterHuntPrompt();
