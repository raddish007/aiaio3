const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLullabyAssets() {
  console.log('🔍 Checking lullaby assets availability...\n');

  try {
    // Check for lullaby audio assets
    console.log('🎵 Checking lullaby audio assets...');
    const { data: audioAssets, error: audioError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'audio')
      .eq('status', 'approved')
      .or('tags.cs.{lullaby_intro,lullaby_outro,lullaby_music},metadata->>template.eq.lullaby');

    if (audioError) {
      console.error('❌ Error fetching audio assets:', audioError);
    } else {
      console.log(`✅ Found ${audioAssets?.length || 0} lullaby audio assets:`);
      audioAssets?.forEach(asset => {
        console.log(`   - ${asset.theme} (${asset.tags?.join(', ')})`);
      });
    }

    // Check for lullaby image assets
    console.log('\n🖼️ Checking lullaby image assets...');
    const { data: imageAssets, error: imageError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'image')
      .eq('status', 'approved')
      .or('tags.cs.{lullaby_intro_bg,lullaby_outro_bg,lullaby_slideshow},metadata->>template.eq.lullaby');

    if (imageError) {
      console.error('❌ Error fetching image assets:', imageError);
    } else {
      console.log(`✅ Found ${imageAssets?.length || 0} lullaby image assets:`);
      imageAssets?.forEach(asset => {
        console.log(`   - ${asset.theme} (${asset.tags?.join(', ')})`);
      });
    }

    // Check for any assets with lullaby tags
    console.log('\n🔍 Checking all assets with lullaby tags...');
    const { data: allLullabyAssets, error: allError } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .or('tags.cs.{lullaby}');

    if (allError) {
      console.error('❌ Error fetching all lullaby assets:', allError);
    } else {
      console.log(`✅ Found ${allLullabyAssets?.length || 0} total assets with lullaby tags:`);
      allLullabyAssets?.forEach(asset => {
        console.log(`   - ${asset.type}: ${asset.theme} (${asset.tags?.join(', ')})`);
      });
    }

    // Check for children
    console.log('\n👶 Checking children...');
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*');

    if (childrenError) {
      console.error('❌ Error fetching children:', childrenError);
    } else {
      console.log(`✅ Found ${children?.length || 0} children:`);
      children?.forEach(child => {
        console.log(`   - ${child.name} (${child.age}, ${child.primary_interest})`);
      });
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Audio assets: ${audioAssets?.length || 0}`);
    console.log(`   Image assets: ${imageAssets?.length || 0}`);
    console.log(`   Total lullaby assets: ${allLullabyAssets?.length || 0}`);
    console.log(`   Children: ${children?.length || 0}`);

    if ((audioAssets?.length || 0) < 3) {
      console.log('\n⚠️ Warning: Need at least 3 audio assets (intro, outro, background music)');
    }
    if ((imageAssets?.length || 0) < 3) {
      console.log('\n⚠️ Warning: Need at least 3 image assets (intro, outro, slideshow)');
    }
    if ((children?.length || 0) === 0) {
      console.log('\n⚠️ Warning: No children found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  console.log('🚀 Checking lullaby assets for video generation...\n');
  
  await checkLullabyAssets();
  
  console.log('\n✅ Asset check complete!');
}

main().catch(console.error); 