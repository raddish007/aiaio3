const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  try {
    console.log('🔍 Testing the exact query from the API...');
    
    // Recreate the exact query from the API
    let approvedVideosQuery = supabase
      .from('child_approved_videos')
      .select(`
        id,
        child_id,
        child_name,
        template_type,
        approval_status,
        created_at,
        video_url
      `)
      .in('approval_status', ['approved', 'pending_review']);

    const { data: approvedVideos, error: approvedError } = await approvedVideosQuery;

    if (approvedError) {
      console.error('❌ Error:', approvedError);
      return;
    }

    console.log(`📊 Query returned ${approvedVideos?.length || 0} videos`);
    
    if (approvedVideos && approvedVideos.length > 0) {
      console.log('\n📄 Sample videos:');
      approvedVideos.slice(0, 5).forEach(video => {
        console.log(`- ${video.child_name} (${video.child_id}): ${video.template_type} - ${video.approval_status}`);
      });
    }

    // Also test without the filter to see all videos
    console.log('\n🔍 Testing without status filter...');
    const { data: allVideos, error: allError } = await supabase
      .from('child_approved_videos')
      .select('id, child_id, child_name, template_type, approval_status, created_at')
      .limit(5);

    if (allError) {
      console.error('❌ Error fetching all videos:', allError);
    } else {
      console.log(`📊 Total videos without filter: ${allVideos?.length || 0}`);
      allVideos?.forEach(video => {
        console.log(`- ${video.child_name}: ${video.approval_status}`);
      });
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testQuery();
