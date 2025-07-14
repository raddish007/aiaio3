const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testLullabyFixes() {
  console.log('🧪 Testing Lullaby Asset Matching Fixes...\n');

  const testChildName = 'Nolan';
  const testTheme = 'dog';

  console.log(`🧪 Testing with child: ${testChildName}, theme: ${testTheme}\n`);

  try {
    // Test 1: Fixed bedtime scene images query
    console.log('1️⃣ Testing fixed bedtime scene images query...');
    const { data: bedtimeImages, error: bedtimeError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'image')
      .or(`metadata->>asset_class.eq.bedtime_scene,metadata->>imageType.eq.bedtime_scene`)
      .or(`metadata->>child_theme.eq.${testTheme},theme.ilike.%${testTheme}%`);

    if (bedtimeError) {
      console.error('❌ Error fetching bedtime images:', bedtimeError);
    } else {
      console.log(`✅ Bedtime scene images: ${bedtimeImages?.length || 0}`);
      if (bedtimeImages && bedtimeImages.length > 0) {
        bedtimeImages.forEach(asset => {
          const assetClass = asset.metadata?.asset_class || asset.metadata?.imageType;
          console.log(`  🌙 ${asset.id.slice(-8)}: class: ${assetClass} | theme: ${asset.theme} | child_theme: ${asset.metadata?.child_theme || 'NOT SET'}`);
        });
      }
    }

    // Test 2: Fixed intro/outro images query
    console.log('\n2️⃣ Testing fixed intro/outro images query...');
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
      console.log(`✅ Theme-specific intro/outro images: ${themeImages?.length || 0}`);
      if (themeImages && themeImages.length > 0) {
        themeImages.forEach(asset => {
          const assetClass = asset.metadata?.asset_class || asset.metadata?.imageType;
          console.log(`  🖼️  ${asset.id.slice(-8)}: class: ${assetClass} | theme: ${asset.theme} | child_theme: ${asset.metadata?.child_theme || 'NOT SET'}`);
        });
      }
    }

    // Test 3: Test theme matching logic
    console.log('\n3️⃣ Testing theme matching logic...');
    if (themeImages && themeImages.length > 0) {
      const introAsset = themeImages.find(a => 
        (a.metadata?.asset_class === 'bedtime_intro' || a.metadata?.imageType === 'bedtime_intro') &&
        (a.metadata?.child_theme === testTheme || a.theme?.toLowerCase().includes(testTheme.toLowerCase()))
      );
      
      const outroAsset = themeImages.find(a => 
        (a.metadata?.asset_class === 'bedtime_outro' || a.metadata?.imageType === 'bedtime_outro') &&
        (a.metadata?.child_theme === testTheme || a.theme?.toLowerCase().includes(testTheme.toLowerCase()))
      );

      console.log(`Intro image match: ${introAsset ? `✅ ${introAsset.id.slice(-8)} (theme: ${introAsset.theme})` : '❌ Not found'}`);
      console.log(`Outro image match: ${outroAsset ? `✅ ${outroAsset.id.slice(-8)} (theme: ${outroAsset.theme})` : '❌ Not found'}`);
    }

    // Test 4: Test old-style slideshow images with all_ok safe_zone
    console.log('\n4️⃣ Testing old-style slideshow images...');
    const { data: oldStyleSlideshowImages, error: oldStyleError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'image')
      .ilike('theme', `%${testTheme}%`);

    if (oldStyleError) {
      console.error('❌ Error fetching old-style images:', oldStyleError);
    } else {
      console.log(`✅ Old-style theme images: ${oldStyleSlideshowImages?.length || 0}`);
      
      const oldStyleImages = oldStyleSlideshowImages?.filter(img => {
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

      console.log(`✅ Images with 'all_ok' safe_zone: ${oldStyleImages?.length || 0}`);
      if (oldStyleImages && oldStyleImages.length > 0) {
        oldStyleImages.slice(0, 3).forEach(asset => {
          const safeZones = asset.metadata?.review?.safe_zone || [];
          console.log(`  🎯 ${asset.id.slice(-8)}: theme: ${asset.theme} | safe_zones: ${JSON.stringify(safeZones)}`);
        });
      }
    }

    // Test 5: Simulate the complete asset matching logic
    console.log('\n5️⃣ Simulating complete asset matching...');
    
    // Simulate the bedtime images processing
    let bedtimeImagesArray = [];
    if (bedtimeImages && bedtimeImages.length > 0) {
      bedtimeImagesArray = bedtimeImages.map(asset => ({
        type: 'image',
        name: `Bedtime Scene ${asset.id.slice(-4)}`,
        description: 'Soothing bedtime imagery',
        status: asset.status === 'approved' ? 'ready' : 'generating',
        url: asset.file_url || '',
        generatedAt: asset.created_at
      }));
    }

    // Simulate fallback to old-style images
    if (oldStyleSlideshowImages && bedtimeImagesArray.length < 15) {
      const oldStyleImages = oldStyleSlideshowImages.filter(img => {
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

      const additionalImages = oldStyleImages
        .slice(0, 15 - bedtimeImagesArray.length)
        .map(asset => ({
          type: 'image',
          name: `Bedtime Scene ${asset.id.slice(-4)} (Legacy)`,
          description: 'Soothing bedtime imagery (from old Lullaby)',
          status: 'ready',
          url: asset.file_url || '',
          generatedAt: asset.created_at
        }));

      bedtimeImagesArray = [...bedtimeImagesArray, ...additionalImages];
    }

    console.log(`📊 Final bedtime images count: ${bedtimeImagesArray.length}`);
    console.log(`📊 Target: 15, Actual: ${bedtimeImagesArray.length}, Status: ${bedtimeImagesArray.length >= 15 ? '✅ SUCCESS' : '❌ INSUFFICIENT'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLullabyFixes(); 