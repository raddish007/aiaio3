#!/usr/bin/env node

// Test script to verify the updated prompt generation doesn't include technical terms
const fetch = require('node-fetch');

async function testUpdatedPrompts() {
  console.log('🧪 Testing Updated Name Show Prompt Generation (No Technical Terms)\n');

  try {
    const formData = {
      childName: 'Andrew',
      theme: 'dogs',
      ageRange: '3-5',
      template: 'name-show',
      personalization: 'personalized',
      safeZones: ['center_safe'],
      promptCount: 1,
      aspectRatio: '16:9',
      artStyle: '2D Pixar Style',
      customArtStyle: '',
      additionalContext: ''
    };

    console.log('📋 Testing with context:', JSON.stringify(formData, null, 2));

    const response = await fetch('http://localhost:3006/api/prompts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ API Response successful!');
      
      Object.entries(result.prompts).forEach(([safeZone, prompts]) => {
        console.log(`\n📍 Safe Zone: ${safeZone}`);
        prompts.images.forEach((prompt, idx) => {
          console.log(`\n${idx + 1}. Generated Prompt:`);
          console.log(prompt);
          
          // Check for problematic technical terms
          const hasCenterSafe = prompt.toLowerCase().includes('center_safe');
          const hasZoneRef = prompt.toLowerCase().includes('zone') && !prompt.toLowerCase().includes('time zone');
          const hasTechnicalTerms = hasCenterSafe || hasZoneRef;
          
          console.log(`\n   ❌ Contains technical terms: ${hasTechnicalTerms ? 'YES - PROBLEM!' : 'NO - GOOD!'}`);
          if (hasCenterSafe) console.log(`   ⚠️  Contains "center_safe": YES`);
          if (hasZoneRef) console.log(`   ⚠️  Contains "zone": YES`);
          
          const hasNameShow = prompt.toLowerCase().includes('the andrew show');
          console.log(`   ✅ Contains "THE ANDREW SHOW": ${hasNameShow ? 'YES' : 'NO'}`);
        });
      });
    } else {
      const error = await response.json();
      console.error('❌ API Error:', error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

// Run the test
testUpdatedPrompts()
  .then(() => {
    console.log('\n🏁 Prompt technical term test complete!');
  });
