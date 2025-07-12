const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkApprovalStatuses() {
  try {
    console.log('🔍 Checking approval statuses...');
    
    // Get all videos with their approval statuses
    const { data: allVideos, error } = await supabase
      .from('child_approved_videos')
      .select('child_name, template_type, approval_status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching videos:', error);
      return;
    }

    console.log(`📊 Found ${allVideos.length} total videos in child_approved_videos`);

    // Group by approval status
    const statusCounts = {};
    allVideos.forEach(video => {
      const status = video.approval_status || 'null';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📄 Videos by approval status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} videos`);
    });

    // Show some examples of each status
    console.log('\n📋 Sample records:');
    const uniqueStatuses = Object.keys(statusCounts);
    for (const status of uniqueStatuses) {
      const examples = allVideos.filter(v => (v.approval_status || 'null') === status).slice(0, 2);
      console.log(`\n${status} examples:`);
      examples.forEach(video => {
        console.log(`  - ${video.child_name}: ${video.template_type} (${video.created_at})`);
      });
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkApprovalStatuses();
