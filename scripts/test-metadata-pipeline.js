// Test script to verify the entire metadata pipeline
const testMetadataPipeline = () => {
  console.log('🧪 Testing metadata pipeline from frontend to API to template...\\n');
  
  // Simulate the frontend data structure
  const themeAssets = {
    letterImages: [
      { 
        id: 'left1', 
        file_url: 'https://example.com/left1.jpg', 
        theme: 'dinosaurs', 
        safe_zone: 'left_safe',
        metadata: { review: { safe_zone: 'left_safe' } }
      },
      { 
        id: 'left2', 
        file_url: 'https://example.com/left2.jpg', 
        theme: 'dinosaurs', 
        safe_zone: 'left_safe',
        metadata: { review: { safe_zone: 'left_safe' } }
      },
      { 
        id: 'right1', 
        file_url: 'https://example.com/right1.jpg', 
        theme: 'dinosaurs', 
        safe_zone: 'right_safe',
        metadata: { review: { safe_zone: 'right_safe' } }
      },
      { 
        id: 'right2', 
        file_url: 'https://example.com/right2.jpg', 
        theme: 'dinosaurs', 
        safe_zone: 'right_safe',
        metadata: { review: { safe_zone: 'right_safe' } }
      }
    ]
  };
  
  // Simulate frontend processing
  console.log('📱 Frontend Processing:');
  console.log('  Original letterImages:', themeAssets.letterImages.map(img => ({
    id: img.id,
    safe_zone: img.safe_zone,
    metadata_safe_zone: img.metadata?.review?.safe_zone
  })));
  
  // Simulate the frontend mapping
  const letterImagesWithMetadata = themeAssets.letterImages?.map(img => ({
    url: img.file_url,
    safeZone: img.metadata?.review?.safe_zone?.includes('left_safe') ? 'left' : 'right'
  })) || [];
  
  console.log('  Mapped letterImagesWithMetadata:', letterImagesWithMetadata);
  
  // Simulate API processing
  console.log('\\n🔌 API Processing:');
  console.log('  Received letterImagesWithMetadata:', letterImagesWithMetadata);
  
  // Simulate template processing
  console.log('\\n🎬 Template Processing:');
  
  const getRandomLetterImage = (index, safeZone) => {
    if (letterImagesWithMetadata && letterImagesWithMetadata.length > 0) {
      const zoneImages = letterImagesWithMetadata.filter(img => img.safeZone === safeZone);
      
      console.log(`    Letter ${index} (${safeZone}): ${zoneImages.length} images available`);
      
      if (zoneImages.length === 0) {
        console.log(`    ⚠️ No ${safeZone} images available, using fallback`);
        return letterImagesWithMetadata[0]?.url;
      }
      
      const randomIndex = Math.floor(Math.random() * zoneImages.length);
      const selectedImage = zoneImages[randomIndex];
      
      console.log(`    ✅ Selected: ${selectedImage.url} (${randomIndex}/${zoneImages.length})`);
      return selectedImage.url;
    }
    
    console.log(`    ⚠️ No metadata available, using fallback logic`);
    return 'fallback-image.jpg';
  };
  
  // Test letter positioning for "LORELEI"
  const letters = 'LORELEI'.split('');
  console.log(`\\n📝 Testing letter positioning for "LORELEI":`);
  
  letters.forEach((letter, index) => {
    const isLeft = index % 2 === 0;
    const safeZone = isLeft ? 'left' : 'right';
    const imageUrl = getRandomLetterImage(index, safeZone);
    
    console.log(`  ${letter} (${index}): ${safeZone} safe zone → ${imageUrl}`);
  });
  
  console.log('\\n✅ Metadata pipeline test completed!');
};

testMetadataPipeline(); 