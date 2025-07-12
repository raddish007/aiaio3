// Test script to verify Letter Hunt TITLE CARD generation with text
const fetch = require('node-fetch');

async function testLetterHuntTitleCardText() {
  try {
    console.log('🧪 Testing Letter Hunt TITLE CARD with "Letter Hunt for [NAME]" text...');
    
    const requestBody = {
      childName: 'Emma',
      theme: 'animals',
      ageRange: '3-5',
      template: 'letter-hunt',
      personalization: 'personalized',
      safeZones: ['all_ok'],
      promptCount: 1,
      aspectRatio: '16:9',
      artStyle: '2D Pixar Style',
      additionalContext: 'Target letter: E',
      assetType: 'titleCard'
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
      console.log('✅ Success! Title Card prompt:');
      console.log('🎨', data.prompts.all_ok.images[0]);
      
      // Check if it mentions "Letter Hunt for Emma"
      const prompt = data.prompts.all_ok.images[0];
      if (prompt.includes('Letter Hunt for Emma') || prompt.includes('Letter Hunt for [NAME]')) {
        console.log('✅ PERFECT! Prompt includes the correct title text.');
      } else {
        console.log('❌ ISSUE: Prompt does not include "Letter Hunt for Emma" text.');
      }
    } else {
      console.log('❌ Error! Status:', response.status);
      console.log('Error details:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error);
  }
}

testLetterHuntTitleCardText();
