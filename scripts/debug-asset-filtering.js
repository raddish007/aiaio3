const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Copy the filtering functions from the video-templates.tsx
const isAssetAppropriateForTemplate = (asset, templateType) => {
  // First check if the asset was specifically assigned to this template during approval
  if (asset.metadata?.template === templateType) {
    return true;
  }

  // Fallback to theme/tag matching for assets without explicit template assignment
  const templateThemes = {
    'lullaby': ['bedtime', 'sleep', 'calm', 'peaceful', 'gentle', 'soothing', 'lullaby', 'night', 'moon', 'stars'],
    'name-video': ['educational', 'learning', 'name', 'alphabet', 'colorful', 'fun', 'playful'],
    'letter-hunt': ['educational', 'learning', 'alphabet', 'letters', 'colorful', 'fun', 'playful']
  };

  const themes = templateThemes[templateType] || [];
  const assetTheme = asset.theme?.toLowerCase() || '';
  const assetTags = asset.tags?.map(tag => tag.toLowerCase()) || [];
  const assetMetadata = asset.metadata?.tags?.map(tag => tag.toLowerCase()) || [];

  return themes.some(theme => 
    assetTheme.includes(theme) || 
    assetTags.some(tag => tag.includes(theme)) ||
    assetMetadata.some(tag => tag.includes(theme))
  );
};

const isAssetThemeAppropriate = (asset, assetPurpose) => {
  const purposeThemes = {
    'background_music': ['music', 'melody', 'song', 'lullaby', 'calm', 'peaceful'],
    'intro_audio': ['voice', 'speech', 'narrated', 'intro', 'welcome'],
    'intro_background': ['background', 'scene', 'setting', 'intro', 'welcome'],
    'slideshow_image': ['scene', 'character', 'setting', 'story', 'visual'],
    'outro_audio': ['voice', 'speech', 'narrated', 'outro', 'goodbye', 'ending'],
    'outro_background': ['background', 'scene', 'setting', 'outro', 'ending']
  };

  const themes = purposeThemes[assetPurpose.purpose] || [];
  const assetTheme = asset.theme?.toLowerCase() || '';
  const assetTags = asset.tags?.map(tag => tag.toLowerCase()) || [];

  return themes.some(theme => 
    assetTheme.includes(theme) || 
    assetTags.some(tag => tag.includes(theme))
  );
};

// Updated filtering logic to match video-templates.tsx
const filterAssets = (allAssets, assetPurpose, templateType) => {
  return allAssets?.filter(asset => {
    // Check if asset is appropriate for template type (primary filter)
    const isTemplateAppropriate = isAssetAppropriateForTemplate(asset, templateType);
    
    if (!isTemplateAppropriate) {
      return false;
    }

    // For safe zone, be more flexible - only require exact match if specified
    // If no safe zone is required, or if asset has no safe zone, allow it
    const hasAppropriateSafeZone = !assetPurpose.safe_zone || 
      !asset.safe_zone || // Allow assets with no safe zone
      asset.safe_zone === assetPurpose.safe_zone ||
      asset.metadata?.safe_zone === assetPurpose.safe_zone;

    // For theme appropriateness, be more lenient - if template is appropriate, allow it
    // Only check theme appropriateness for very specific purposes
    const hasAppropriateTheme = assetPurpose.purpose === 'background_music' ? 
      isAssetThemeAppropriate(asset, assetPurpose) : true;

    return hasAppropriateSafeZone && hasAppropriateTheme;
  }) || [];
};

async function debugAssetFiltering() {
  console.log('Debugging Asset Filtering...\n');

  try {
    // 1. Get all approved assets
    console.log('1. Fetching all approved assets...');
    const { data: allAssets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching assets:', error);
      return;
    }

    console.log(`✅ Found ${allAssets?.length || 0} approved assets total`);

    // 2. Show sample assets
    if (allAssets && allAssets.length > 0) {
      console.log('\n2. Sample assets:');
      allAssets.slice(0, 5).forEach((asset, index) => {
        console.log(`   ${index + 1}. ${asset.theme} (${asset.type})`);
        console.log(`      - Safe zone: ${asset.safe_zone || 'none'}`);
        console.log(`      - Tags: ${asset.tags?.join(', ') || 'none'}`);
        console.log(`      - Metadata: ${JSON.stringify(asset.metadata || {})}`);
      });
    }

    // 3. Test filtering for lullaby template
    console.log('\n3. Testing filtering for lullaby template...');
    
    const testAssetPurpose = {
      purpose: 'intro_background',
      type: 'image',
      safe_zone: 'intro_safe'
    };

    const testTemplateType = 'lullaby';

    // Test each asset with new filtering logic
    const filteredResults = allAssets?.map(asset => {
      const isTemplateAppropriate = isAssetAppropriateForTemplate(asset, testTemplateType);
      
      if (!isTemplateAppropriate) {
        return {
          asset: asset.theme,
          type: asset.type,
          safeZone: asset.safe_zone,
          theme: asset.theme,
          tags: asset.tags,
          isTemplateAppropriate: false,
          hasAppropriateSafeZone: false,
          hasAppropriateTheme: false,
          passes: false,
          reason: 'Template inappropriate'
        };
      }

      // For safe zone, be more flexible
      const hasAppropriateSafeZone = !testAssetPurpose.safe_zone || 
        !asset.safe_zone || // Allow assets with no safe zone
        asset.safe_zone === testAssetPurpose.safe_zone ||
        asset.metadata?.safe_zone === testAssetPurpose.safe_zone;

      // For theme appropriateness, be more lenient
      const hasAppropriateTheme = testAssetPurpose.purpose === 'background_music' ? 
        isAssetThemeAppropriate(asset, testAssetPurpose) : true;

      const passes = hasAppropriateSafeZone && hasAppropriateTheme;
      
      return {
        asset: asset.theme,
        type: asset.type,
        safeZone: asset.safe_zone,
        theme: asset.theme,
        tags: asset.tags,
        isTemplateAppropriate,
        hasAppropriateSafeZone,
        hasAppropriateTheme,
        passes,
        reason: passes ? 'Passes all filters' : 
                !hasAppropriateSafeZone ? 'Safe zone mismatch' : 
                !hasAppropriateTheme ? 'Theme inappropriate' : 'Unknown'
      };
    }) || [];

    console.log('\nFiltering results:');
    filteredResults.forEach(result => {
      const status = result.passes ? '✅ PASSES' : '❌ FAILS';
      console.log(`${status} ${result.asset} (${result.type})`);
      console.log(`   Template appropriate: ${result.isTemplateAppropriate ? '✓' : '✗'}`);
      console.log(`   Safe zone: ${result.safeZone} (required: ${testAssetPurpose.safe_zone}) - ${result.hasAppropriateSafeZone ? '✓' : '✗'}`);
      console.log(`   Theme appropriate: ${result.hasAppropriateTheme ? '✓' : '✗'}`);
      console.log(`   Reason: ${result.reason}`);
    });

    const passingAssets = filteredResults.filter(r => r.passes);
    console.log(`\n✅ ${passingAssets.length} assets pass all filters`);

    // 4. Test different asset purposes
    console.log('\n4. Testing different asset purposes...');
    
    const testPurposes = [
      { purpose: 'background_music', type: 'audio', safe_zone: null },
      { purpose: 'intro_background', type: 'image', safe_zone: 'intro_safe' },
      { purpose: 'slideshow_image', type: 'image', safe_zone: 'slideshow' },
      { purpose: 'outro_background', type: 'image', safe_zone: 'outro_safe' }
    ];

    testPurposes.forEach(testPurpose => {
      console.log(`\nTesting ${testPurpose.purpose}:`);
      const purposeResults = filterAssets(allAssets, testPurpose, testTemplateType);
      console.log(`   ${purposeResults.length} assets pass for ${testPurpose.purpose}`);
      
      if (purposeResults.length > 0) {
        purposeResults.slice(0, 3).forEach(asset => {
          console.log(`     - ${asset.theme} (${asset.type})`);
        });
      }
    });

    // 5. Show what themes are actually in the database
    console.log('\n5. Analyzing themes in database...');
    const themes = [...new Set(allAssets?.map(a => a.theme?.toLowerCase()).filter(Boolean) || [])];
    console.log('Unique themes found:', themes.slice(0, 10));

    // 6. Test individual filter functions
    console.log('\n6. Testing individual filter functions...');
    
    if (allAssets && allAssets.length > 0) {
      const testAsset = allAssets[0];
      console.log(`Testing with asset: ${testAsset.theme}`);
      
      const templateResult = isAssetAppropriateForTemplate(testAsset, 'lullaby');
      const themeResult = isAssetThemeAppropriate(testAsset, testAssetPurpose);
      
      console.log(`   Template appropriate for lullaby: ${templateResult}`);
      console.log(`   Theme appropriate for intro_background: ${themeResult}`);
      
      // Show what themes are being checked
      const lullabyThemes = ['bedtime', 'sleep', 'calm', 'peaceful', 'gentle', 'soothing', 'lullaby', 'night', 'moon', 'stars'];
      const introThemes = ['background', 'scene', 'setting', 'intro', 'welcome'];
      
      console.log(`   Lullaby themes checked: ${lullabyThemes.join(', ')}`);
      console.log(`   Intro themes checked: ${introThemes.join(', ')}`);
      console.log(`   Asset theme: "${testAsset.theme}"`);
      console.log(`   Asset tags: ${testAsset.tags?.join(', ') || 'none'}`);
    }

  } catch (error) {
    console.error('❌ Debug failed with error:', error);
  }
}

debugAssetFiltering(); 