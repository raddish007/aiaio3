const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugLullabyAssetMatching() {
  console.log('🔍 Debugging Lullaby Asset Matching...\n');

  // Test with a specific child and theme
  const testChildName = 'Nolan';
  const testTheme = 'dog';

  console.log(`🧪 Testing with child: ${testChildName}, theme: ${testTheme}\n`);

  try {
    // Test 1: Child-specific assets
    console.log('1️⃣ Testing child-specific assets...');
    const { data: specificAssets, error: specificError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'lullaby')
      .eq('metadata->>child_name', testChildName);

    if (specificError) {
      console.error('❌ Error fetching specific assets:', specificError);
    } else {
      console.log(`✅ Child-specific assets: ${specificAssets?.length || 0}`);
      if (specificAssets && specificAssets.length > 0) {
        specificAssets.forEach(asset => {
          const assetClass = asset.metadata?.asset_class || asset.metadata?.audio_class;
          console.log(`  📦 ${asset.id.slice(-8)}: ${asset.type} | class: ${assetClass} | status: ${asset.status}`);
        });
      }
    }

    // Test 2: Bedtime scene images for theme
    console.log('\n2️⃣ Testing bedtime scene images for theme...');
    const { data: bedtimeImages, error: bedtimeError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .or(`metadata->>asset_class.eq.bedtime_scene,metadata->>imageType.eq.bedtime_scene`)
      .eq('metadata->>child_theme', testTheme);

    if (bedtimeError) {
      console.error('❌ Error fetching bedtime images:', bedtimeError);
    } else {
      console.log(`✅ Bedtime scene images: ${bedtimeImages?.length || 0}`);
      if (bedtimeImages && bedtimeImages.length > 0) {
        bedtimeImages.forEach(asset => {
          const assetClass = asset.metadata?.asset_class || asset.metadata?.imageType;
          console.log(`  🌙 ${asset.id.slice(-8)}: class: ${assetClass} | theme: ${asset.metadata?.child_theme} | status: ${asset.status}`);
        });
      }
    }

    // Test 3: Theme-specific intro/outro images
    console.log('\n3️⃣ Testing theme-specific intro/outro images...');
    const { data: themeImages, error: themeError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .or(`metadata->>asset_class.in.(bedtime_intro,bedtime_outro),metadata->>imageType.in.(bedtime_intro,bedtime_outro)`)
      .eq('metadata->>template', 'lullaby');

    if (themeError) {
      console.error('❌ Error fetching theme images:', themeError);
    } else {
      console.log(`✅ Theme-specific intro/outro images: ${themeImages?.length || 0}`);
      if (themeImages && themeImages.length > 0) {
        themeImages.forEach(asset => {
          const assetClass = asset.metadata?.asset_class || asset.metadata?.imageType;
          console.log(`  🖼️  ${asset.id.slice(-8)}: class: ${assetClass} | template: ${asset.metadata?.template} | status: ${asset.status}`);
        });
      }
    }

    // Test 4: Old-style theme-matching images
    console.log('\n4️⃣ Testing old-style theme-matching images...');
    const { data: oldStyleImages, error: oldStyleError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .ilike('theme', `%${testTheme}%`);

    if (oldStyleError) {
      console.error('❌ Error fetching old-style images:', oldStyleError);
    } else {
      console.log(`✅ Old-style theme images: ${oldStyleImages?.length || 0}`);
      if (oldStyleImages && oldStyleImages.length > 0) {
        oldStyleImages.slice(0, 5).forEach(asset => {
          const safeZones = asset.metadata?.review?.safe_zone || [];
          console.log(`  🎨 ${asset.id.slice(-8)}: theme: ${asset.theme} | safe_zones: ${JSON.stringify(safeZones)}`);
        });
        if (oldStyleImages.length > 5) {
          console.log(`  ... and ${oldStyleImages.length - 5} more`);
        }
      }
    }

    // Test 5: Check what bedtime_scene assets exist without theme filter
    console.log('\n5️⃣ Checking all bedtime_scene assets...');
    const { data: allBedtimeScenes, error: allBedtimeError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .or(`metadata->>asset_class.eq.bedtime_scene,metadata->>imageType.eq.bedtime_scene`);

    if (allBedtimeError) {
      console.error('❌ Error fetching all bedtime scenes:', allBedtimeError);
    } else {
      console.log(`✅ All bedtime scene assets: ${allBedtimeScenes?.length || 0}`);
      if (allBedtimeScenes && allBedtimeScenes.length > 0) {
        console.log('  Available themes:');
        const themes = [...new Set(allBedtimeScenes.map(asset => asset.metadata?.child_theme).filter(Boolean))];
        themes.forEach(theme => {
          const count = allBedtimeScenes.filter(asset => asset.metadata?.child_theme === theme).length;
          console.log(`    ${theme}: ${count} assets`);
        });
      }
    }

    // Test 6: Check what intro/outro assets exist without template filter
    console.log('\n6️⃣ Checking all intro/outro assets...');
    const { data: allIntroOutro, error: allIntroOutroError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .or(`metadata->>asset_class.in.(bedtime_intro,bedtime_outro),metadata->>imageType.in.(bedtime_intro,bedtime_outro)`);

    if (allIntroOutroError) {
      console.error('❌ Error fetching all intro/outro assets:', allIntroOutroError);
    } else {
      console.log(`✅ All intro/outro assets: ${allIntroOutro?.length || 0}`);
      if (allIntroOutro && allIntroOutro.length > 0) {
        console.log('  Available templates:');
        const templates = [...new Set(allIntroOutro.map(asset => asset.metadata?.template).filter(Boolean))];
        templates.forEach(template => {
          const count = allIntroOutro.filter(asset => asset.metadata?.template === template).length;
          console.log(`    ${template}: ${count} assets`);
        });
      }
    }

    // Test 7: Check for assets with 'all_ok' safe_zone for dog theme
    console.log('\n7️⃣ Checking for dog theme assets with all_ok safe_zone...');
    const { data: dogAllOkAssets, error: dogAllOkError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .ilike('theme', `%${testTheme}%`);

    if (dogAllOkError) {
      console.error('❌ Error fetching dog all_ok assets:', dogAllOkError);
    } else {
      console.log(`✅ Dog theme assets: ${dogAllOkAssets?.length || 0}`);
      if (dogAllOkAssets && dogAllOkAssets.length > 0) {
        const allOkAssets = dogAllOkAssets.filter(img => {
          const safeZones = img.metadata?.review?.safe_zone || [];
          if (Array.isArray(safeZones)) {
            return safeZones.includes('all_ok');
          } else if (typeof safeZones === 'string') {
            return safeZones.includes('all_ok');
          } else if (safeZones && typeof safeZones === 'object') {
            return JSON.stringify(safeZones).includes('all_ok');
          }
          return false;
        });
        console.log(`  Assets with 'all_ok' safe_zone: ${allOkAssets.length}`);
        allOkAssets.slice(0, 3).forEach(asset => {
          const safeZones = asset.metadata?.review?.safe_zone || [];
          console.log(`    🎯 ${asset.id.slice(-8)}: safe_zones: ${JSON.stringify(safeZones)}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugLullabyAssetMatching(); 