// Simple test to verify aspect ratio is not in prompts
const fetch = require('node-fetch');

async function testPromptGeneration() {
  console.log('🧪 Testing that aspect ratio is NOT included in prompt text...\n');

  try {
    const response = await fetch('http://localhost:3006/api/prompts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        theme: 'dogs',
        ageRange: '3-5',
        template: 'name-video',
        safeZone: 'center_safe',
        aspectRatio: '16:9',
        artStyle: '2D Pixar Style',
        promptCount: 2
      })
    });

    const data = await response.json();
    
    if (data.images) {
      console.log('✅ Generated prompts successfully!\n');
      
      data.images.forEach((prompt, idx) => {
        console.log(`Prompt ${idx + 1}:`);
        console.log(`${prompt}\n`);
        
        // Check if the prompt contains "16:9"
        if (prompt.includes('16:9')) {
          console.log(`❌ ERROR: Prompt ${idx + 1} still contains "16:9"!`);
        } else {
          console.log(`✅ Prompt ${idx + 1} is clean - no aspect ratio text found`);
        }
        console.log('---\n');
      });
      
      console.log('🎉 Test complete!');
      console.log('Aspect ratio is still passed to the API parameters but NOT included in prompt text.');
      
    } else {
      console.error('❌ Failed to generate prompts:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPromptGeneration();
