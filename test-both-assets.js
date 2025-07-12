// Test both title card and sign image to verify different behaviors
const fetch = require('node-fetch');

async function testBothAssetTypes() {
  try {
    console.log('🧪 Testing TITLE CARD (should show "Letter Hunt for Emma")...');
    
    const titleCardRequest = {
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
    
    let response = await fetch('http://localhost:3001/api/prompts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(titleCardRequest)
    });
    
    let data = await response.json();
    if (response.ok) {
      console.log('✅ Title Card:', data.prompts.all_ok.images[0].substring(0, 150) + '...');
      console.log(data.prompts.all_ok.images[0].includes('Letter Hunt for Emma') ? '✅ Has title text' : '❌ Missing title text');
    }
    
    console.log('\n🧪 Testing SIGN IMAGE (should show letter E on signs)...');
    
    const signImageRequest = {
      ...titleCardRequest,
      assetType: 'signImage'
    };
    
    response = await fetch('http://localhost:3001/api/prompts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signImageRequest)
    });
    
    data = await response.json();
    if (response.ok) {
      console.log('✅ Sign Image:', data.prompts.all_ok.images[0].substring(0, 150) + '...');
      console.log(data.prompts.all_ok.images[0].includes('letter E') || data.prompts.all_ok.images[0].includes('letter \'E\'') ? '✅ Has letter E' : '❌ Missing letter E');
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error);
  }
}

testBothAssetTypes();
