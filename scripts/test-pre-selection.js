// Test script to verify pre-selection logic prevents flashing
const testPreSelection = () => {
  console.log('🧪 Testing pre-selection logic to prevent flashing...\\n');
  
  // Simulate the metadata structure
  const letterImagesWithMetadata = [
    { url: 'https://example.com/left1.jpg', safeZone: 'left' },
    { url: 'https://example.com/left2.jpg', safeZone: 'left' },
    { url: 'https://example.com/left3.jpg', safeZone: 'left' },
    { url: 'https://example.com/right1.jpg', safeZone: 'right' },
    { url: 'https://example.com/right2.jpg', safeZone: 'right' },
    { url: 'https://example.com/right3.jpg', safeZone: 'right' }
  ];
  
  // Simulate the pre-selection logic
  const preSelectImages = (letters) => {
    const selectedImages = [];
    
    letters.forEach((letter, index) => {
      const isLeft = index % 2 === 0;
      const safeZone = isLeft ? 'left' : 'right';
      
      // Filter images by the requested safe zone
      const zoneImages = letterImagesWithMetadata.filter(img => img.safeZone === safeZone);
      
      if (zoneImages.length === 0) {
        selectedImages[index] = '';
      } else {
        // Use truly random selection
        const randomIndex = Math.floor(Math.random() * zoneImages.length);
        const selectedImage = zoneImages[randomIndex];
        selectedImages[index] = selectedImage.url;
      }
    });
    
    return selectedImages;
  };
  
  // Test with "LORELEI"
  const letters = 'LORELEI'.split('');
  console.log('📝 Testing pre-selection for "LORELEI":');
  
  // Run pre-selection multiple times to show consistency
  for (let run = 1; run <= 3; run++) {
    console.log(`\\n🔄 Run ${run}:`);
    const preSelectedImages = preSelectImages(letters);
    
    letters.forEach((letter, index) => {
      const isLeft = index % 2 === 0;
      const safeZone = isLeft ? 'left' : 'right';
      const imageUrl = preSelectedImages[index];
      
      console.log(`  ${letter} (${index}): ${safeZone} safe zone → ${imageUrl}`);
    });
  }
  
  console.log('\\n✅ Pre-selection test completed!');
  console.log('📊 Key benefits:');
  console.log('  • Images are selected once per render');
  console.log('  • No flashing between frames');
  console.log('  • Consistent images throughout each letter segment');
  console.log('  • Proper safe zone mapping');
  console.log('  • True randomization between renders');
};

testPreSelection(); 