require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseAssets() {
  console.log('🔍 Checking database assets...\n');

  try {
    // Check child_approved_videos table
    console.log('1️⃣ Checking child_approved_videos table...');
    const { data: approvedVideos, error: approvedError } = await supabase
      .from('child_approved_videos')
      .select('id, video_url, video_title, approval_status, created_at')
      .eq('approval_status', 'approved')
      .not('video_url', 'is', null);

    if (approvedError) {
      console.error('❌ Error fetching approved videos:', approvedError);
    } else {
      console.log(`✅ Found ${approvedVideos?.length || 0} approved videos`);
      if (approvedVideos && approvedVideos.length > 0) {
        console.log('   Sample videos:');
        approvedVideos.slice(0, 3).forEach(video => {
          console.log(`   • ${video.video_title || 'Untitled'} (${video.id})`);
        });
      }
    }

    // Check published_videos table
    console.log('\n2️⃣ Checking published_videos table...');
    const { data: publishedVideos, error: publishedError } = await supabase
      .from('published_videos')
      .select('id, video_url, title, is_published, created_at')
      .eq('is_published', true)
      .not('video_url', 'is', null);

    if (publishedError) {
      console.error('❌ Error fetching published videos:', publishedError);
    } else {
      console.log(`✅ Found ${publishedVideos?.length || 0} published videos`);
      if (publishedVideos && publishedVideos.length > 0) {
        console.log('   Sample videos:');
        publishedVideos.slice(0, 3).forEach(video => {
          console.log(`   • ${video.title || 'Untitled'} (${video.id})`);
        });
      }
    }

    // Check assets table
    console.log('\n3️⃣ Checking assets table...');
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id, url, file_url, theme, type, status, created_at')
      .or('url.not.is.null,file_url.not.is.null');

    if (assetsError) {
      console.error('❌ Error fetching assets:', assetsError);
    } else {
      console.log(`✅ Found ${assets?.length || 0} assets with URLs`);
      if (assets && assets.length > 0) {
        console.log('   Sample assets:');
        assets.slice(0, 3).forEach(asset => {
          const url = asset.url || asset.file_url;
          console.log(`   • ${asset.theme} (${asset.type}) - ${asset.status}`);
        });
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   - Approved videos: ${approvedVideos?.length || 0}`);
    console.log(`   - Published videos: ${publishedVideos?.length || 0}`);
    console.log(`   - Assets with URLs: ${assets?.length || 0}`);
    console.log(`   - Total database objects: ${(approvedVideos?.length || 0) + (publishedVideos?.length || 0) + (assets?.length || 0)}`);

    console.log('\n💡 If you see database objects above, they should appear in the S3 browser');
    console.log('   when S3 listing fails or when using the database fallback.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabaseAssets(); 