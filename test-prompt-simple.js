/**
 * Simple test script to verify the new prompt engine
 * Run this with: node test-prompt-simple.js
 */

const { PromptEngine } = require('./lib/prompt-engine');

async function quickTest() {
  console.log('🧪 Quick Test of New Prompt Engine\n');
  
  try {
    console.log('Testing dogs theme with variety...');
    const result = await PromptEngine.generatePrompts({
      theme: 'dogs',
      templateType: 'name-video',
      ageRange: '3-5',
      safeZone: 'center_safe',
      aspectRatio: '16:9',
      artStyle: '2D Pixar Style',
      promptCount: 3
    });

    console.log('✅ SUCCESS! Generated prompts:');
    result.images.forEach((prompt, idx) => {
      console.log(`\n${idx + 1}. ${prompt.substring(0, 200)}...`);
    });
    
    if (result.metadata.variations) {
      console.log(`\n🎯 Variations used: ${result.metadata.variations.join(', ')}`);
    }
    
    // Check for problematic text
    const hasProblems = result.images.some(prompt => 
      prompt.toLowerCase().includes('40%') || 
      prompt.toLowerCase().includes('left 40%')
    );
    
    if (hasProblems) {
      console.log('\n❌ WARNING: Found problematic safe zone text');
    } else {
      console.log('\n✅ Safe zone instructions look good - no problematic text found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest();
