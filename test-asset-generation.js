require('dotenv').config({ path: '.env.local' });

async function testAssetGeneration() {
  console.log('🧪 Testing Asset Generation API...\n');

  try {
    // Test the asset generation API directly
    const testPayload = {
      promptId: null, // No prompt ID for direct test
      assetType: 'image',
      prompt: 'A magical wish button in a child\'s bedroom, Pixar 3D style, safe zone for text overlay',
      aspectRatio: '16:9',
      style: 'pixar_3d',
      safeZone: 'center_safe',
      imageType: 'storybook_page',
      template: 'wish-button',
      theme: 'magical',
      page: 'page1',
      childName: 'Test Child',
      ageRange: '5-8'
    };

    console.log('📤 Sending test request to asset generation API...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch('http://localhost:3000/api/assets/generate-fal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ API Response:', JSON.stringify(result, null, 2));

    if (result.success && result.asset) {
      console.log('\n🎉 Asset created successfully!');
      console.log('Asset ID:', result.asset.id);
      console.log('Asset URL:', result.asset.url);
      console.log('Asset Metadata:', result.asset.metadata);
      
      // Verify the metadata fields
      const metadata = result.asset.metadata;
      console.log('\n📋 Metadata Verification:');
      console.log('- Template:', metadata.template);
      console.log('- Page:', metadata.page);
      console.log('- Asset Purpose:', metadata.asset_purpose);
      console.log('- Has URL:', !!result.asset.url);
      
      if (metadata.template === 'wish-button' && 
          metadata.page === 'page1' && 
          metadata.asset_purpose === 'page1' &&
          result.asset.url) {
        console.log('✅ All metadata fields correctly set!');
      } else {
        console.log('❌ Some metadata fields missing or incorrect');
      }
    } else {
      console.log('❌ Asset creation failed:', result.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testAssetGeneration().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 