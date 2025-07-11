#!/usr/bin/env node

// Test script to debug Name Show prompt generation
const { PromptEngine } = require('./lib/prompt-engine');

async function testNameShowPrompts() {
  console.log('🧪 Testing Name Show Prompt Generation for Andrew (Dogs Theme)\n');

  try {
    const context = {
      theme: 'dogs',
      templateType: 'name-show',
      ageRange: '3-5',
      safeZone: 'all_ok',
      aspectRatio: '16:9',
      artStyle: '2D Pixar Style',
      promptCount: 3,
      childName: 'Andrew'
    };

    console.log('📋 Context:', context);
    console.log('\n🔄 Generating prompts...\n');

    const result = await PromptEngine.generatePrompts(context);

    console.log('✅ Generated prompts:');
    result.images.forEach((prompt, idx) => {
      console.log(`\n${idx + 1}. ${prompt}`);
      
      // Check if the prompt contains the expected text
      const hasNameShow = prompt.toLowerCase().includes('the andrew show');
      const hasTheme = prompt.toLowerCase().includes('dog');
      
      console.log(`   ✅ Contains "THE ANDREW SHOW": ${hasNameShow ? 'YES' : 'NO'}`);
      console.log(`   ✅ Contains dog theme: ${hasTheme ? 'YES' : 'NO'}`);
    });

    console.log('\n📊 Metadata:');
    console.log(`   Template: ${result.metadata.template}`);
    console.log(`   Safe Zone: ${result.metadata.safeZone}`);
    console.log(`   Theme: ${result.metadata.theme}`);
    console.log(`   Variations: ${result.metadata.variations.join(', ')}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Also test what the admin form would send
async function testAdminFormData() {
  console.log('\n🖥️ Testing what the admin form would send...\n');

  const formData = {
    childName: 'Andrew',
    theme: 'dogs',
    ageRange: '3-5',
    template: 'name-show',
    personalization: 'personalized',
    safeZones: ['all_ok'],
    promptCount: 3,
    aspectRatio: '16:9',
    artStyle: '2D Pixar Style',
    customArtStyle: '',
    additionalContext: ''
  };

  console.log('📋 Form data that would be sent:', JSON.stringify(formData, null, 2));

  try {
    // Test the API endpoint logic
    const response = await fetch('http://localhost:3000/api/prompts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ API Response successful!');
      console.log('Prompts generated:', Object.keys(result.prompts).length);
      
      Object.entries(result.prompts).forEach(([safeZone, prompts]) => {
        console.log(`\n📍 Safe Zone: ${safeZone}`);
        prompts.images.forEach((prompt, idx) => {
          console.log(`   ${idx + 1}. ${prompt.substring(0, 100)}...`);
          
          const hasNameShow = prompt.toLowerCase().includes('the andrew show');
          console.log(`      Contains "THE ANDREW SHOW": ${hasNameShow ? '✅ YES' : '❌ NO'}`);
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

// Run the tests
testNameShowPrompts()
  .then(() => testAdminFormData())
  .then(() => {
    console.log('\n🏁 Test complete!');
  });
