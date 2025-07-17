require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMetadataMatching() {
  console.log('🔍 Testing metadata matching...\n');

  try {
    // Get a sample video from the database
    const { data: videos, error } = await supabase
      .from('child_approved_videos')
      .select('id, video_url, video_title, created_at')
      .eq('approval_status', 'approved')
      .not('video_url', 'is', null)
      .limit(3);

    if (error) {
      console.error('❌ Error fetching videos:', error);
      return;
    }

    console.log('📁 Sample videos from database:');
    videos.forEach(video => {
      console.log(`  • ${video.video_title}`);
      console.log(`    URL: ${video.video_url}`);
      
      // Extract key from URL
      const key = video.video_url.replace('https://aiaio3-public-videos.s3.amazonaws.com/', '');
      console.log(`    Key: ${key}`);
      
      // Extract UUID
      const uuidMatch = video.video_url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
      if (uuidMatch) {
        console.log(`    UUID: ${uuidMatch[0]}`);
      }
      console.log('');
    });

    // Test the specific UUID we saw in S3
    const testUuid = '47540d2d-8b17-4339-8d45-5d5b8a4199d0';
    console.log(`🔍 Looking for videos with UUID: ${testUuid}`);
    
    const { data: matchingVideos, error: matchError } = await supabase
      .from('child_approved_videos')
      .select('id, video_url, video_title')
      .ilike('video_url', `%${testUuid}%`);

    if (matchError) {
      console.error('❌ Error searching for UUID:', matchError);
    } else if (matchingVideos && matchingVideos.length > 0) {
      console.log('✅ Found matching videos:');
      matchingVideos.forEach(video => {
        console.log(`  • ${video.video_title} (${video.id})`);
        console.log(`    URL: ${video.video_url}`);
      });
    } else {
      console.log('❌ No videos found with that UUID');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testMetadataMatching(); 