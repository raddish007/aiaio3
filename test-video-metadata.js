const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testVideoMetadata() {
  console.log('🔍 Testing video metadata data...\n');

  try {
    // Get a few videos from child_approved_videos
    const { data: videos, error } = await supabase
      .from('child_approved_videos')
      .select('*')
      .limit(3);

    if (error) {
      console.error('Error fetching videos:', error);
      return;
    }

    console.log(`📹 Found ${videos.length} videos:\n`);

    videos.forEach((video, index) => {
      console.log(`=== Video ${index + 1} ===`);
      console.log('ID:', video.id);
      console.log('Title:', video.video_title);
      console.log('Template Type:', video.template_type);
      console.log('Child Name:', video.child_name);
      console.log('Child Theme:', video.child_theme);
      console.log('Personalization Level:', video.personalization_level);
      console.log('Used Assets:', video.used_assets);
      console.log('Template Data:', video.template_data);
      console.log('Video URL:', video.video_url);
      console.log('Duration:', video.duration_seconds);
      console.log('Approval Status:', video.approval_status);
      console.log('');

      // If there are used assets, try to fetch them
      if (video.used_assets && video.used_assets.length > 0) {
        console.log('🔍 Fetching used assets...');
        fetchUsedAssets(video.used_assets, video.template_type);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

async function fetchUsedAssets(assetIds, templateType) {
  try {
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .in('id', assetIds);

    if (error) {
      console.error('Error fetching assets:', error);
      return;
    }

    console.log(`📦 Found ${assets.length} assets for template ${templateType}:`);
    assets.forEach((asset, index) => {
      console.log(`  Asset ${index + 1}:`);
      console.log(`    ID: ${asset.id}`);
      console.log(`    Type: ${asset.type}`);
      console.log(`    Theme: ${asset.theme}`);
      console.log(`    File URL: ${asset.file_url}`);
      console.log(`    Metadata:`, asset.metadata);
      console.log('');
    });
  } catch (error) {
    console.error('Error fetching used assets:', error);
  }
}

testVideoMetadata(); 