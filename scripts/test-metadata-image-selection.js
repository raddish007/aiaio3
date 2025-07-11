// Test script to verify metadata-based image selection logic
const testMetadataImageSelection = () => {
  console.log('🧪 Testing metadata-based image selection logic...\n');
  
  // Simulate the new metadata structure from the frontend
  const letterImagesWithMetadata = [
    { url: 'https://example.com/left1.jpg', safeZone: 'left' },
    { url: 'https://example.com/left2.jpg', safeZone: 'left' },
    { url: 'https://example.com/left3.jpg', safeZone: 'left' },
    { url: 'https://example.com/left4.jpg', safeZone: 'left' },
    { url: 'https://example.com/left5.jpg', safeZone: 'left' },
    { url: 'https://example.com/right1.jpg', safeZone: 'right' },
    { url: 'https://example.com/right2.jpg', safeZone: 'right' },
    { url: 'https://example.com/right3.jpg', safeZone: 'right' },
    { url: 'https://example.com/right4.jpg', safeZone: 'right' }
  ];
  
  console.log('📊 Metadata-based image pools:');
  console.log(`  Total images: ${letterImagesWithMetadata.length}`);
  console.log(`  Left images: ${letterImagesWithMetadata.filter(img => img.safeZone === 'left').length}`);
  console.log(`  Right images: ${letterImagesWithMetadata.filter(img => img.safeZone === 'right').length}`);
  console.log();
  
  // Simulate the new getRandomLetterImage function
  const getRandomLetterImage = (index, safeZone) => {
    // Filter images by the requested safe zone
    const zoneImages = letterImagesWithMetadata.filter(img => img.safeZone === safeZone);
    
    console.log(`🖼️ Metadata-based image selection for letter ${index} (${safeZone}):`, {
      totalImages: letterImagesWithMetadata.length,
      zoneImages: zoneImages.length,
      requestedZone: safeZone,
      availableZones: letterImagesWithMetadata.map(img => img.safeZone)
    });
    
    if (zoneImages.length === 0) {
      console.warn(`⚠️ No ${safeZone} images available in metadata, using fallback`);
      return letterImagesWithMetadata[0]?.url;
    }
    
    // Use truly random selection
    const randomIndex = Math.floor(Math.random() * zoneImages.length);
    const selectedImage = zoneImages[randomIndex];
    
    console.log(`🖼️ Letter ${index} (${safeZone}): Selected image ${randomIndex}/${zoneImages.length} = ${selectedImage.url}`);
    
    return selectedImage.url;
  };
  
  // Test "Lorelei" letter mapping
  const letters = ['L', 'O', 'R', 'E', 'L', 'E', 'I'];
  const safeZones = ['left', 'right', 'left', 'right', 'left', 'right', 'left'];
  
  console.log('🎬 Testing "Lorelei" letter mapping:');
  console.log(`  Pattern: ${letters.map((letter, i) => `${letter}(${safeZones[i]})`).join(' ')}`);
  console.log();
  
  // Test multiple renders
  for (let render = 1; render <= 3; render++) {
    console.log(`🎲 Render ${render}:`);
    
    letters.forEach((letter, index) => {
      const safeZone = safeZones[index];
      const selectedImage = getRandomLetterImage(index, safeZone);
      console.log(`  ${letter} (${safeZone}): ${selectedImage}`);
    });
    
    console.log();
  }
  
  console.log('✅ If you see different images for each letter above, metadata-based selection is working!');
  console.log('✅ Each letter should only get images from its correct safe zone.');
  console.log('❌ If you see the same images every time, there might be an issue.');
};

testMetadataImageSelection(); 