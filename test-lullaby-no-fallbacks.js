const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testLullabyNoFallbacks() {
  console.log('🧪 Testing Lullaby Asset Matching (No Fallbacks)...\n');

  const testChildName = 'Andrew';
  const testTheme = 'dogs';

  console.log(`🧪 Testing with child: ${testChildName}, theme: ${testTheme}\n`);

  try {
    // Test 1: Child-specific assets (lullaby template only)
    console.log('1️⃣ Testing child-specific assets (lullaby template only)...');
    const { data: specificAssets, error: specificError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'lullaby')
      .eq('metadata->>child_name', testChildName);

    if (specificError) {
      console.error('❌ Error fetching specific assets:', specificError);
    } else {
      console.log(`✅ Child-specific lullaby assets: ${specificAssets?.length || 0}`);
      if (specificAssets && specificAssets.length > 0) {
        specificAssets.forEach(asset => {
          const assetClass = asset.metadata?.asset_class || asset.metadata?.audio_class;
          console.log(`  📦 ${asset.id.slice(-8)}: ${asset.type} | class: ${assetClass} | template: ${asset.metadata?.template}`);
        });
      }
    }

    // Test 2: Bedtime scene images (lullaby template only)
    console.log('\n2️⃣ Testing bedtime scene images (lullaby template only)...');
    const { data: bedtimeImages, error: bedtimeError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .eq('metadata->>template', 'lullaby')
      .or(`metadata->>asset_class.eq.bedtime_scene,metadata->>imageType.eq.bedtime_scene`)
      .or(`metadata->>child_theme.eq.${testTheme},theme.ilike.%${testTheme}%`);

    if (bedtimeError) {
      console.error('❌ Error fetching bedtime images:', bedtimeError);
    } else {
      console.log(`✅ Lullaby bedtime scene images: ${bedtimeImages?.length || 0}`);
      if (bedtimeImages && bedtimeImages.length > 0) {
        bedtimeImages.forEach(asset => {
          const assetClass = asset.metadata?.asset_class || asset.metadata?.imageType;
          console.log(`  🌙 ${asset.id.slice(-8)}: class: ${assetClass} | theme: ${asset.theme} | template: ${asset.metadata?.template}`);
        });
      }
    }

    // Test 3: Theme-specific intro/outro images (lullaby template only)
    console.log('\n3️⃣ Testing theme-specific intro/outro images (lullaby template only)...');
    const { data: themeImages, error: themeError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .or(`metadata->>asset_class.in.(bedtime_intro,bedtime_outro),metadata->>imageType.in.(bedtime_intro,bedtime_outro)`)
      .eq('metadata->>template', 'lullaby')
      .or(`metadata->>child_theme.eq.${testTheme},theme.ilike.%${testTheme}%`);

    if (themeError) {
      console.error('❌ Error fetching theme images:', themeError);
    } else {
      console.log(`✅ Lullaby theme-specific intro/outro images: ${themeImages?.length || 0}`);
      if (themeImages && themeImages.length > 0) {
        themeImages.forEach(asset => {
          const assetClass = asset.metadata?.asset_class || asset.metadata?.imageType;
          console.log(`  🖼️  ${asset.id.slice(-8)}: class: ${assetClass} | theme: ${asset.theme} | template: ${asset.metadata?.template}`);
        });
      }
    }

    // Test 4: Check for any non-lullaby images that might have been included before
    console.log('\n4️⃣ Checking for non-lullaby images with similar asset classes...');
    const { data: nonLullabyImages, error: nonLullabyError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .or(`metadata->>asset_class.eq.bedtime_scene,metadata->>imageType.eq.bedtime_scene`)
      .or(`metadata->>child_theme.eq.${testTheme},theme.ilike.%${testTheme}%`)
      .neq('metadata->>template', 'lullaby');

    if (nonLullabyError) {
      console.error('❌ Error fetching non-lullaby images:', nonLullabyError);
    } else {
      console.log(`⚠️  Non-lullaby images with similar asset classes: ${nonLullabyImages?.length || 0}`);
      if (nonLullabyImages && nonLullabyImages.length > 0) {
        nonLullabyImages.slice(0, 5).forEach(asset => {
          const assetClass = asset.metadata?.asset_class || asset.metadata?.imageType;
          console.log(`  ⚠️  ${asset.id.slice(-8)}: class: ${assetClass} | theme: ${asset.theme} | template: ${asset.metadata?.template}`);
        });
        if (nonLullabyImages.length > 5) {
          console.log(`  ... and ${nonLullabyImages.length - 5} more (these would have been included with fallbacks)`);
        }
      }
    }

    // Test 5: Summary
    console.log('\n5️⃣ Summary:');
    console.log(`📊 Child-specific lullaby assets: ${specificAssets?.length || 0}`);
    console.log(`📊 Lullaby bedtime scene images: ${bedtimeImages?.length || 0}`);
    console.log(`📊 Lullaby intro/outro images: ${themeImages?.length || 0}`);
    console.log(`📊 Non-lullaby images excluded: ${nonLullabyImages?.length || 0}`);
    
    const totalLullabyAssets = (specificAssets?.length || 0) + (bedtimeImages?.length || 0) + (themeImages?.length || 0);
    console.log(`📊 Total lullaby-specific assets: ${totalLullabyAssets}`);
    console.log(`✅ Status: ${totalLullabyAssets > 0 ? 'SUCCESS - Only lullaby assets found' : 'WARNING - No lullaby assets found'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLullabyNoFallbacks(); 