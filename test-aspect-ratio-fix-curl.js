// Simple test using curl to verify aspect ratio is not in prompts
const { exec } = require('child_process');

async function testPromptGeneration() {
  console.log('🧪 Testing that aspect ratio is NOT included in prompt text...\n');

  const curlCommand = `curl -X POST http://localhost:3006/api/prompts/generate \\
    -H "Content-Type: application/json" \\
    -d '{
      "theme": "dogs",
      "ageRange": "3-5", 
      "template": "name-video",
      "safeZone": "center_safe",
      "aspectRatio": "16:9",
      "artStyle": "2D Pixar Style",
      "promptCount": 2
    }'`;

  exec(curlCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Test failed:', error.message);
      return;
    }

    if (stderr) {
      console.error('❌ Stderr:', stderr);
      return;
    }

    try {
      const data = JSON.parse(stdout);
      
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
        console.error('❌ Failed to generate prompts:', data.error || 'Unknown error');
        console.log('Raw response:', stdout);
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse response:', parseError.message);
      console.log('Raw response:', stdout);
    }
  });
}

testPromptGeneration();
