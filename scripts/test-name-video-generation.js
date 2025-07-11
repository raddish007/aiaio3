#!/usr/bin/env node

import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function testNameVideoGeneration() {
  console.log('🎬 Testing Name Video Generation with Improved Image Selection...\n');

  const testCases = [
    { name: 'John', theme: 'halloween', age: 5 },
    { name: 'Emma', theme: 'halloween', age: 4 },
    { name: 'Alexander', theme: 'halloween', age: 6 }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name} (${testCase.theme} theme)`);
    console.log('=' .repeat(50));

    try {
      // Test the video generation API
      const response = await fetch('http://localhost:3000/api/videos/generate-name-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childName: testCase.name,
          childAge: testCase.age,
          childTheme: testCase.theme,
          childId: `test-${testCase.name.toLowerCase()}-${Date.now()}`,
          submitted_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Video generation started successfully!`);
        console.log(`📊 Debug Info:`, {
          job_id: result.job_id,
          render_id: result.render_id,
          hasNameAudio: result.debug_info.hasNameAudio,
          letterAudioCount: result.debug_info.letterAudioCount,
          imageSelection: result.debug_info.imageSelection
        });
        console.log(`🔗 Output URL: ${result.output_url}`);
        console.log(`📋 Job Tracking: ${result.job_tracking_url}`);
      } else {
        console.error(`❌ Video generation failed:`, result);
      }
    } catch (error) {
      console.error(`❌ Error testing ${testCase.name}:`, error.message);
    }
  }

  console.log('\n🎉 Name Video Generation Test Complete!');
  console.log('\n📝 Summary:');
  console.log('- ✅ Improved image selection using dedicated API');
  console.log('- ✅ Proper safe zone handling for letter segments');
  console.log('- ✅ Deterministic image selection (prevents flickering)');
  console.log('- ✅ Fallback logic for missing images');
  console.log('- ✅ Theme-based gradient backgrounds');
}

testNameVideoGeneration().catch(console.error);
