// Test script to verify frontend image randomization
const testFrontendRandomization = () => {
  console.log('🧪 Testing frontend image randomization logic...\n');
  
  // Simulate the image selection logic from name-video-request.tsx
  const leftImages = [
    { id: 'left1', file_url: 'https://example.com/left1.jpg', theme: 'dinosaurs', safe_zone: 'left_safe' },
    { id: 'left2', file_url: 'https://example.com/left2.jpg', theme: 'dinosaurs', safe_zone: 'left_safe' },
    { id: 'left3', file_url: 'https://example.com/left3.jpg', theme: 'dinosaurs', safe_zone: 'left_safe' },
    { id: 'left4', file_url: 'https://example.com/left4.jpg', theme: 'dinosaurs', safe_zone: 'left_safe' },
    { id: 'left5', file_url: 'https://example.com/left5.jpg', theme: 'dinosaurs', safe_zone: 'left_safe' }
  ];
  
  const rightImages = [
    { id: 'right1', file_url: 'https://example.com/right1.jpg', theme: 'dinosaurs', safe_zone: 'right_safe' },
    { id: 'right2', file_url: 'https://example.com/right2.jpg', theme: 'dinosaurs', safe_zone: 'right_safe' },
    { id: 'right3', file_url: 'https://example.com/right3.jpg', theme: 'dinosaurs', safe_zone: 'right_safe' },
    { id: 'right4', file_url: 'https://example.com/right4.jpg', theme: 'dinosaurs', safe_zone: 'right_safe' }
  ];
  
  console.log('📊 Original image pools:');
  console.log(`  Left images (${leftImages.length}):`, leftImages.map(img => img.id));
  console.log(`  Right images (${rightImages.length}):`, rightImages.map(img => img.id));
  console.log();
  
  // Test multiple selections to see if randomization works
  console.log('🎲 Testing frontend randomization (5 renders):');
  
  for (let render = 1; render <= 5; render++) {
    // Simulate the new randomization logic
    const allLetterImages = [...leftImages, ...rightImages];
    const letterImages = allLetterImages.sort(() => Math.random() - 0.5);
    
    console.log(`  Render ${render}:`, letterImages.map(img => img.id));
  }
  
  console.log('\n✅ If you see different image orders above, frontend randomization is working!');
  console.log('❌ If you see the same order every time, there might be an issue.');
  console.log('\n🔍 This should now provide different image arrays to the Remotion template,');
  console.log('   which combined with the template randomization should give truly random results.');
};

testFrontendRandomization(); 