const fetch = require('node-fetch');

async function testPromptGenerator() {
  console.log('🧪 Testing Prompt Generator...\n');

  const testCases = [
    {
      name: 'Lullaby Template - General',
      data: {
        theme: 'Space Adventure',
        ageRange: '3-5',
        template: 'lullaby',
        personalization: 'general',
        safeZone: 'slideshow',
        duration: 90,
        additionalContext: 'Focus on peaceful space exploration with gentle stars and planets'
      }
    },
    {
      name: 'Name Video Template - Personalized',
      data: {
        childName: 'Emma',
        theme: 'Ocean Friends',
        ageRange: '4-6',
        template: 'name-video',
        personalization: 'personalized',
        safeZone: 'center_safe',
        duration: 60,
        additionalContext: 'Emma loves dolphins and sea turtles'
      }
    },
    {
      name: 'Lullaby Template - Frame',
      data: {
        theme: 'Forest Animals',
        ageRange: '2-4',
        template: 'lullaby',
        personalization: 'general',
        safeZone: 'frame',
        duration: 75,
        additionalContext: 'Gentle forest creatures preparing for bedtime'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log('=' .repeat(50));

    try {
      const response = await fetch('http://localhost:3000/api/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });

      if (response.ok) {
        const result = await response.json();
        
        console.log('✅ Success!');
        console.log('📊 Generated prompts:');
        console.log(`   Backgrounds: ${result.prompts.backgrounds.length}`);
        console.log(`   Characters: ${result.prompts.characters.length}`);
        console.log(`   Props: ${result.prompts.props.length}`);
        console.log(`   Voiceover: ${result.prompts.voiceover ? 'Generated' : 'Missing'}`);
        console.log(`   Music: ${result.prompts.music ? 'Generated' : 'Missing'}`);
        
        console.log('\n🎨 Sample Background Prompt:');
        console.log(result.prompts.backgrounds[0]);
        
        console.log('\n🎭 Sample Character Prompt:');
        console.log(result.prompts.characters[0]);
        
        console.log('\n🎵 Voiceover Script:');
        console.log(result.prompts.voiceover.substring(0, 200) + '...');
        
        console.log('\n🎼 Music Description:');
        console.log(result.prompts.music);
        
        console.log('\n📋 Metadata:');
        console.log(`   Template: ${result.prompts.metadata.template}`);
        console.log(`   Safe Zone: ${result.prompts.metadata.safeZone}`);
        console.log(`   Theme: ${result.prompts.metadata.theme}`);
        console.log(`   Age Range: ${result.prompts.metadata.ageRange}`);

      } else {
        const error = await response.json();
        console.log('❌ Failed:', error.error);
        if (error.details) {
          console.log('Details:', error.details);
        }
      }

    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n🎉 Prompt generator test completed!');
}

// Test with direct API call (without server)
async function testDirectPromptGenerator() {
  console.log('🧪 Testing Direct Prompt Generator (without server)...\n');

  try {
    // Import the prompt generator directly
    const { PromptGenerator } = require('../lib/prompt-generator.ts');
    
    const context = {
      childName: 'Alex',
      theme: 'Dinosaur Adventure',
      ageRange: '4-6',
      template: 'name-video',
      personalization: 'personalized',
      safeZone: 'left_safe',
      duration: 60,
      additionalContext: 'Alex loves T-Rex and learning about dinosaurs'
    };

    console.log('📝 Generating prompts with context:', context);
    
    const prompts = await PromptGenerator.generatePrompts(context);
    
    console.log('✅ Success!');
    console.log('📊 Generated prompts:');
    console.log(`   Backgrounds: ${prompts.backgrounds.length}`);
    console.log(`   Characters: ${prompts.characters.length}`);
    console.log(`   Props: ${prompts.props.length}`);
    
    console.log('\n🎨 Sample Background Prompt:');
    console.log(prompts.backgrounds[0]);
    
    console.log('\n🎭 Sample Character Prompt:');
    console.log(prompts.characters[0]);
    
    console.log('\n🎵 Voiceover Script:');
    console.log(prompts.voiceover.substring(0, 200) + '...');
    
    console.log('\n🎼 Music Description:');
    console.log(prompts.music);

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the appropriate test based on whether server is running
async function runTest() {
  try {
    // Try server test first
    await testPromptGenerator();
  } catch (error) {
    console.log('Server not available, trying direct test...');
    await testDirectPromptGenerator();
  }
}

runTest(); 