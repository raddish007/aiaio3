// Test script to verify theme matching logic
console.log('🧪 Testing Theme Matching Logic\n');

// Mock asset data based on actual database
const mockAssets = [
  {
    id: 'c39cf5dc-dc21-4057-84d6-7ac059e1ee96',
    type: 'video',
    metadata: { theme: 'Dinosaurs' },
    file_url: 'https://example.com/dinosaur-search.mp4'
  },
  {
    id: '9b211a49-820f-477a-9512-322795762221', 
    type: 'video',
    metadata: { theme: 'Dog' },
    file_url: 'https://example.com/dog-search.mp4'
  },
  {
    id: 'b4bb12bd-f2a3-4035-9d38-6fca03b9c8dc',
    type: 'video', 
    metadata: { theme: 'Halloween' },
    file_url: 'https://example.com/halloween-search.mp4'
  }
];

// Test theme matching for 'dogs' theme
function testThemeMatching(desiredTheme) {
  console.log(`\n=== Testing theme: ${desiredTheme} ===`);
  
  const existingByType = new Map();
  const videoErrors = [];
  
  // Process assets (simulating the search video detection)
  mockAssets.forEach(asset => {
    const assetKey = 'intro2Video'; // All these are search videos
    
    const existingAsset = existingByType.get(assetKey);
    let shouldUseThisAsset = false;
    
    // Apply our strict theme matching logic with normalization
    const currentTheme = asset.metadata?.theme?.toLowerCase();
    const desiredThemeLower = desiredTheme.toLowerCase();
    
    // Normalize theme names to handle plural/singular differences
    const normalizeTheme = (theme) => {
      const normalized = theme.toLowerCase();
      // Handle common plural/singular cases
      if (normalized === 'dogs' || normalized === 'dog') return 'dog';
      if (normalized === 'dinosaurs' || normalized === 'dinosaur') return 'dinosaur';
      if (normalized === 'cats' || normalized === 'cat') return 'cat';
      if (normalized === 'adventures' || normalized === 'adventure') return 'adventure';
      return normalized;
    };
    
    const normalizedCurrentTheme = normalizeTheme(currentTheme || '');
    const normalizedDesiredTheme = normalizeTheme(desiredThemeLower);
    
    if (normalizedCurrentTheme === normalizedDesiredTheme) {
      if (!existingAsset) {
        // First matching theme video found
        shouldUseThisAsset = true;
        console.log(`✅ First ${assetKey} video with matching theme: ${currentTheme}`);
      } else {
        // Multiple videos with same theme - randomly select between them
        const shouldReplace = Math.random() < 0.5; // 50% chance to replace
        if (shouldReplace) {
          shouldUseThisAsset = true;
          console.log(`🎲 Randomly replacing ${assetKey}: ${existingAsset.theme} → ${currentTheme} (random selection)`);
        } else {
          console.log(`🎲 Randomly keeping existing ${assetKey}: ${existingAsset.theme} (random selection)`);
        }
      }
    } else {
      // Theme doesn't match - skip this asset
      shouldUseThisAsset = false;
      console.log(`⚠️ Skipping video asset ${assetKey} - theme mismatch: ${currentTheme} !== ${desiredThemeLower}`);
    }
    
    if (shouldUseThisAsset) {
      existingByType.set(assetKey, {
        url: asset.file_url,
        status: 'ready',
        assetId: asset.id,
        theme: asset.metadata?.theme
      });
      console.log(`✅ Using asset: ${assetKey} (${asset.type}) - ${asset.file_url} [Theme: ${asset.metadata.theme}]`);
    }
  });
  
  // Check for errors (no matching theme found)
  const hasMatchingVideo = existingByType.has('intro2Video');
  if (!hasMatchingVideo) {
    const availableThemes = mockAssets.map(v => v.metadata?.theme).filter(t => t);
    const error = {
      type: 'intro2Video',
      error: 'theme_mismatch',
      message: `No intro2Video video found for theme "${desiredTheme}". Available themes: ${availableThemes.join(', ')}`,
      availableThemes
    };
    videoErrors.push(error);
    console.error(`❌ ${error.message}`);
  }
  
  const finalAsset = existingByType.get('intro2Video');
  console.log(`\n📊 RESULT for ${desiredTheme}:`);
  if (finalAsset) {
    console.log(`✅ Selected: ${finalAsset.assetId} (Theme: ${finalAsset.theme})`);
    console.log(`   URL: ${finalAsset.url}`);
  } else {
    console.log(`❌ No video found - will show as "missing" in UI`);
  }
  
  return { finalAsset, hasError: videoErrors.length > 0 };
}

// Test different themes
const testCases = [
  'dogs',      // Should find Dog video
  'dog',       // Should find Dog video (case insensitive)
  'dinosaurs', // Should find Dinosaurs video
  'halloween', // Should find Halloween video
  'cats',      // Should show error - no cats theme available
  'adventure'  // Should show error - no adventure theme available
];

testCases.forEach(theme => {
  const result = testThemeMatching(theme);
  console.log('─'.repeat(50));
});

console.log('\n🎯 Summary:');
console.log('✅ Exact theme matches will find and display the correct video');
console.log('❌ No theme matches will show "missing" status with error message');
console.log('🎲 Multiple same-theme videos will be randomly selected');
