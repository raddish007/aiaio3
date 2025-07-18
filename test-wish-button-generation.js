#!/usr/bin/env node

/**
 * Test Wish Button Video Generation
 * This script tests the complete end-to-end flow
 */

const fetch = require('node-fetch');

const testPayload = {
  projectId: 'test-project-123',
  childId: 'test-child-456',
  assets: {
    page1: {
      image: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/test-image-1.jpg',
      audio: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/test-audio-1.mp3'
    },
    page2: {
      image: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/test-image-2.jpg', 
      audio: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/test-audio-2.mp3'
    }
  },
  storyVariables: {
    childName: 'Alex',
    theme: 'forest adventure',
    visualStyle: 'watercolor',
    wishResultItems: 'magical seeds, tiny dragon, enchanted compass',
    mainCharacter: 'A brave young explorer named Alex who loves discovering hidden treasures',
    sidekick: 'A wise talking owl who guides adventures with ancient knowledge',
    buttonLocation: 'hidden beneath the roots of the Great Oak Tree'
  },
  backgroundMusicUrl: 'https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/background-music.mp3'
};

async function testWishButtonGeneration() {
  console.log('🧪 Testing Wish Button Video Generation');
  console.log('======================================');
  
  try {
    console.log('📤 Sending test payload to API...');
    
    const response = await fetch('http://localhost:3000/api/videos/generate-wish-button', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ API Response:');
    console.log('   Success:', result.success);
    console.log('   Job ID:', result.job_id);
    console.log('   Render ID:', result.render_id);
    console.log('   Output URL:', result.output_url);
    
    console.log('\n🎬 Video generation started successfully!');
    console.log('📍 Check the video status in your admin panel');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the Next.js server is running (npm run dev)');
    console.log('   2. Check that the REMOTION_SITE_URL is updated in .env.local');
    console.log('   3. Verify AWS credentials are correct');
    console.log('   4. Check that the Lambda function exists');
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  testWishButtonGeneration();
}

module.exports = { testWishButtonGeneration };
