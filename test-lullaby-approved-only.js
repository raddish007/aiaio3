const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testLullabyApprovedOnly() {
  console.log('🧪 Testing Lullaby Approved Assets Only...\n');

  try {
    // Test with Andrew (dogs theme)
    const childName = 'Andrew';
    const themeToUse = 'dogs';
    
    console.log(`🎯 Testing for child: ${childName} (theme: ${themeToUse})`);

    // Test the exact queries from the updated lullaby request v2 page
    const [
      specificAssets,
      bedtimeImages, 
      backgroundMusicAsset,
      themeImages
    ] = await Promise.all([
      // Child-specific assets (approved only)
      supabaseAdmin
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .eq('metadata->>template', 'lullaby')
        .eq('metadata->>child_name', childName),
      
      // Bedtime scene images for theme (lullaby template only, approved only)
      supabaseAdmin
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .eq('type', 'image')
        .eq('metadata->>template', 'lullaby')
        .or(`metadata->>asset_class.eq.bedtime_scene,metadata->>imageType.eq.bedtime_scene`)
        .or(`metadata->>child_theme.eq.${themeToUse},theme.ilike.%${themeToUse}%`),
      
      // Background music (DreamDrip asset)
      supabaseAdmin
        .from('assets')
        .select('*')
        .eq('id', '2095fd08-1cb1-4373-bafa-f6115dd7dad2')
        .single(),
      
      // Theme-specific intro/outro images (approved only)
      supabaseAdmin
        .from('assets')
        .select('*')
        .eq('status', 'approved')
        .eq('type', 'image')
        .or(`metadata->>asset_class.in.(bedtime_intro,bedtime_outro),metadata->>imageType.in.(bedtime_intro,bedtime_outro)`)
        .eq('metadata->>template', 'lullaby')
        .or(`metadata->>child_theme.eq.${themeToUse},theme.ilike.%${themeToUse}%`)
    ]);

    console.log('\n📊 Results:');
    console.log(`✅ Child-specific assets: ${specificAssets.data?.length || 0}`);
    console.log(`✅ Bedtime scene images: ${bedtimeImages.data?.length || 0}`);
    console.log(`✅ Background music: ${backgroundMusicAsset.data ? 'Found' : 'Missing'}`);
    console.log(`✅ Theme intro/outro images: ${themeImages.data?.length || 0}`);

    // Check for any unapproved assets
    console.log('\n🔍 Checking for unapproved assets...');
    
    const allQueriedAssets = [
      ...(specificAssets.data || []),
      ...(bedtimeImages.data || []),
      ...(themeImages.data || [])
    ];

    const unapprovedAssets = allQueriedAssets.filter(asset => asset.status !== 'approved');
    
    if (unapprovedAssets.length > 0) {
      console.log(`❌ Found ${unapprovedAssets.length} unapproved assets:`);
      unapprovedAssets.forEach(asset => {
        console.log(`  - ${asset.id.slice(-8)}: ${asset.status} | ${asset.metadata?.asset_class || asset.metadata?.imageType || 'unknown'}`);
      });
    } else {
      console.log('✅ All assets are approved!');
    }

    // Show what assets would be used
    console.log('\n📝 Assets that would be used:');
    
    if (specificAssets.data && specificAssets.data.length > 0) {
      console.log('\n🎯 Child-specific assets:');
      specificAssets.data.forEach(asset => {
        const assetClass = asset.metadata?.asset_class || asset.metadata?.audio_class;
        console.log(`  - ${asset.id.slice(-8)}: ${assetClass} (${asset.status})`);
      });
    }

    if (bedtimeImages.data && bedtimeImages.data.length > 0) {
      console.log('\n🌙 Bedtime scene images:');
      bedtimeImages.data.forEach(asset => {
        const assetClass = asset.metadata?.asset_class || asset.metadata?.imageType;
        console.log(`  - ${asset.id.slice(-8)}: ${assetClass} (${asset.status})`);
      });
    }

    if (themeImages.data && themeImages.data.length > 0) {
      console.log('\n🎨 Theme intro/outro images:');
      themeImages.data.forEach(asset => {
        const assetClass = asset.metadata?.asset_class || asset.metadata?.imageType;
        console.log(`  - ${asset.id.slice(-8)}: ${assetClass} (${asset.status})`);
      });
    }

    // Check for any letter-hunt assets that shouldn't be included
    const letterHuntAssets = allQueriedAssets.filter(asset => 
      asset.metadata?.template === 'letter-hunt' || 
      asset.metadata?.asset_class?.includes('letter') ||
      asset.metadata?.imageType?.includes('letter')
    );

    if (letterHuntAssets.length > 0) {
      console.log(`\n⚠️  Found ${letterHuntAssets.length} letter-hunt assets that shouldn't be included:`);
      letterHuntAssets.forEach(asset => {
        console.log(`  - ${asset.id.slice(-8)}: ${asset.metadata?.template || 'unknown'} | ${asset.metadata?.asset_class || asset.metadata?.imageType || 'unknown'}`);
      });
    } else {
      console.log('\n✅ No letter-hunt assets found (good!)');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testLullabyApprovedOnly(); 