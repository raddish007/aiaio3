// Test script to verify image randomization
const testRandomization = () => {
  console.log('🧪 Testing image randomization logic...\n');
  
  // Simulate the image splitting logic from NameVideo.tsx
  const letterImageUrls = [
    'https://example.com/left1.jpg',
    'https://example.com/left2.jpg', 
    'https://example.com/left3.jpg',
    'https://example.com/left4.jpg',
    'https://example.com/left5.jpg',
    'https://example.com/right1.jpg',
    'https://example.com/right2.jpg',
    'https://example.com/right3.jpg',
    'https://example.com/right4.jpg'
  ];
  
  const midPoint = Math.ceil(letterImageUrls.length / 2);
  const leftImages = letterImageUrls.slice(0, midPoint);
  const rightImages = letterImageUrls.slice(midPoint);
  
  console.log('📊 Image pools:');
  console.log(`  Left images (${leftImages.length}):`, leftImages);
  console.log(`  Right images (${rightImages.length}):`, rightImages);
  console.log();
  
  // Test multiple selections for the same letter to see if randomization works
  const testLetter = 'L';
  const testIndex = 0;
  const testSafeZone = 'left';
  
  console.log(`🎲 Testing randomization for letter "${testLetter}" (index ${testIndex}, ${testSafeZone} safe zone):`);
  
  const zoneImages = testSafeZone === 'left' ? leftImages : rightImages;
  
  // Simulate multiple renders
  for (let render = 1; render <= 5; render++) {
    const randomIndex = Math.floor(Math.random() * zoneImages.length);
    const selectedImage = zoneImages[randomIndex];
    console.log(`  Render ${render}: Selected image ${randomIndex}/${zoneImages.length} = ${selectedImage}`);
  }
  
  console.log('\n✅ If you see different image selections above, randomization is working!');
  console.log('❌ If you see the same image every time, there might be an issue.');
};

testRandomization(); 