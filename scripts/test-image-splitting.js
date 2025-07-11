require('dotenv').config({ path: '.env.local' });

// Test the image splitting logic
function testImageSplitting(childName, letterImageUrls) {
  const letters = childName.toUpperCase().split('');
  const leftLetterCount = Math.ceil(letters.length / 2);
  const rightLetterCount = Math.floor(letters.length / 2);
  
  console.log(`\n🧪 Testing image splitting for "${childName}":`);
  console.log(`   Total letters: ${letters.length}`);
  console.log(`   Left letters needed: ${leftLetterCount}`);
  console.log(`   Right letters needed: ${rightLetterCount}`);
  console.log(`   Total images: ${letterImageUrls.length}`);
  
  // Split images
  const midPoint = Math.ceil(letterImageUrls.length / 2);
  const leftImages = letterImageUrls.slice(0, midPoint);
  const rightImages = letterImageUrls.slice(midPoint);
  
  console.log(`   Midpoint: ${midPoint}`);
  console.log(`   Left images: ${leftImages.length}`);
  console.log(`   Right images: ${rightImages.length}`);
  
  // Show the pattern
  const pattern = letters.map((letter, i) => `${letter}(${i % 2 === 0 ? 'LEFT' : 'RIGHT'})`).join(' ');
  console.log(`   Pattern: ${pattern}`);
  
  // Check if we have enough images
  const hasEnoughLeft = leftImages.length >= leftLetterCount;
  const hasEnoughRight = rightImages.length >= rightLetterCount;
  
  console.log(`   ✅ Enough left images: ${hasEnoughLeft}`);
  console.log(`   ✅ Enough right images: ${hasEnoughRight}`);
  
  if (!hasEnoughLeft || !hasEnoughRight) {
    console.log(`   ⚠️  WARNING: Not enough images for safe zones!`);
  }
  
  return { hasEnoughLeft, hasEnoughRight, leftImages, rightImages };
}

// Test with the actual data from the job
const testData = {
  childName: "Lorelei",
  letterImageUrls: [
    "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053332_22rrqamqp.png",
    "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053332_jv1uf3zh8.png",
    "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053332_455ixzfip.png",
    "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053332_s0aq79eth.png",
    "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053332_uta595anf.png",
    "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053332_b3do2n17h.png",
    "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053332_9zpf9s24h.png",
    "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053332_6bpetkeq2.png",
    "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/image/1752097053332_u1b3e4ky7.png"
  ]
};

testImageSplitting(testData.childName, testData.letterImageUrls);

// Test other name lengths
console.log('\n📊 Testing other name lengths:');
['Li', 'Nolan', 'Lorelei', 'Christopher'].forEach(name => {
  const mockImages = Array.from({ length: 9 }, (_, i) => `image_${i}.png`);
  testImageSplitting(name, mockImages);
}); 