const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugThemeLetterAssets() {
  console.log('🔍 Debugging theme and letter-specific assets...\n');

  // Get all Letter Hunt assets
  const { data: allAssets, error } = await supabase
    .from('assets')
    .select('*')
    .eq('metadata->>template', 'letter-hunt')
    .in('status', ['approved', 'pending']);

  if (error) {
    console.error('Error fetching assets:', error);
    return;
  }

  console.log(`📦 Found ${allAssets.length} Letter Hunt assets\n`);

  // Group and analyze assets
  const assetsByType = {};
  const themeCounts = {};
  const letterCounts = {};

  allAssets.forEach(asset => {
    const metadata = asset.metadata || {};
    
    // Track asset types
    const assetKey = metadata.imageType || metadata.assetPurpose || metadata.videoType || 
                     metadata.section || metadata.category || 'unknown';
    
    if (!assetsByType[assetKey]) {
      assetsByType[assetKey] = [];
    }
    assetsByType[assetKey].push(asset);

    // Track themes
    const theme = metadata.theme || metadata.child_theme || 'no-theme';
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;

    // Track letters
    const letter = metadata.targetLetter || metadata.letter || 'no-letter';
    letterCounts[letter] = (letterCounts[letter] || 0) + 1;

    console.log(`📄 Asset ${asset.id} (${asset.type}):`);
    console.log(`   File: ${asset.file_url}`);
    console.log(`   Key: ${assetKey}`);
    console.log(`   Theme: ${theme}`);
    console.log(`   Letter: ${letter}`);
    console.log(`   Child: ${metadata.child_name || 'none'}`);
    console.log(`   Status: ${asset.status}`);
    console.log(`   Full metadata:`, JSON.stringify(metadata, null, 2));
    console.log('');
  });

  console.log('\n📊 SUMMARY:');
  console.log('\n🎯 Assets by Type:');
  Object.entries(assetsByType).forEach(([key, assets]) => {
    console.log(`   ${key}: ${assets.length} assets`);
  });

  console.log('\n🎨 Assets by Theme:');
  Object.entries(themeCounts).forEach(([theme, count]) => {
    console.log(`   ${theme}: ${count} assets`);
  });

  console.log('\n🔤 Assets by Letter:');
  Object.entries(letterCounts).forEach(([letter, count]) => {
    console.log(`   ${letter}: ${count} assets`);
  });

  // Find theme + letter specific assets
  console.log('\n🎯 Theme + Letter Specific Assets:');
  const themeLetterAssets = allAssets.filter(asset => {
    const metadata = asset.metadata || {};
    const hasTheme = metadata.theme || metadata.child_theme;
    const hasLetter = metadata.targetLetter || metadata.letter;
    return hasTheme && hasLetter;
  });

  if (themeLetterAssets.length > 0) {
    themeLetterAssets.forEach(asset => {
      const metadata = asset.metadata || {};
      const theme = metadata.theme || metadata.child_theme;
      const letter = metadata.targetLetter || metadata.letter;
      const assetKey = metadata.imageType || metadata.assetPurpose || metadata.videoType || 
                       metadata.section || metadata.category;
      
      console.log(`   ✅ ${assetKey} - Theme: ${theme}, Letter: ${letter}`);
      console.log(`      File: ${asset.file_url}`);
    });
  } else {
    console.log('   ❌ No theme + letter specific assets found');
  }

  // Test specific queries that the UI would use
  console.log('\n🧪 Testing UI Query Logic:');
  
  const testChild = 'Andrew';
  const testLetter = 'A';
  const testTheme = 'adventure';

  // Test specific asset query (child + letter)
  const { data: specificAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('metadata->>child_name', testChild)
    .eq('metadata->>targetLetter', testLetter);

  console.log(`\n🎯 Child-specific assets (${testChild} + ${testLetter}): ${specificAssets?.length || 0}`);

  // Test letter-specific video assets
  const { data: letterAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'video')
    .eq('metadata->>targetLetter', testLetter);

  console.log(`🔤 Letter-specific video assets (${testLetter}): ${letterAssets?.length || 0}`);

  // Test theme-specific video assets
  const { data: themeAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'video')
    .eq('metadata->>theme', testTheme);

  console.log(`🎨 Theme-specific video assets (${testTheme}): ${themeAssets?.length || 0}`);

  // Test generic video assets
  const { data: genericAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'video')
    .is('metadata->>child_name', null);

  console.log(`🌐 Generic video assets: ${genericAssets?.length || 0}`);
}

// Run the debug
debugThemeLetterAssets().catch(console.error);
