const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkChildVideos() {
  try {
    console.log('🔍 Checking videos for Andrew, Lorelei, and Nolan...\n');
    
    // Get children data
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, name, primary_interest, age')
      .in('name', ['Andrew', 'Lorelei', 'Nolan'])
      .order('name');

    if (childrenError) {
      console.error('Error fetching children:', childrenError);
      return;
    }

    console.log('👶 Children found:');
    children.forEach(child => {
      console.log(`  - ${child.name} (ID: ${child.id}, Age: ${child.age}, Theme: ${child.primary_interest})`);
    });

    // Get videos for these children
    const { data: videos, error: videosError } = await supabase
      .from('child_approved_videos')
      .select('id, child_name, video_title, consumer_title, template_type, approval_status, is_published, created_at')
      .in('child_name', ['Andrew', 'Lorelei', 'Nolan'])
      .order('child_name, created_at');

    if (videosError) {
      console.error('Error fetching videos:', videosError);
      return;
    }

    console.log('\n📺 Videos found:');
    if (videos.length === 0) {
      console.log('  No videos found for these children');
    } else {
      const videosByChild = {};
      videos.forEach(video => {
        if (!videosByChild[video.child_name]) {
          videosByChild[video.child_name] = [];
        }
        videosByChild[video.child_name].push(video);
      });

      Object.entries(videosByChild).forEach(([childName, childVideos]) => {
        console.log(`\n  ${childName}:`);
        childVideos.forEach(video => {
          const status = video.approval_status === 'approved' && video.is_published ? '✅ Published' : 
                        video.approval_status === 'approved' ? '⚠️ Approved but not published' : 
                        `❌ ${video.approval_status}`;
          console.log(`    - ${video.template_type}: ${video.consumer_title || video.video_title} (${status})`);
        });
      });
    }

    // Check for any videos that could be published
    const { data: publishableVideos, error: publishableError } = await supabase
      .from('child_approved_videos')
      .select('child_name, video_title, template_type, approval_status, is_published')
      .in('child_name', ['Andrew', 'Lorelei', 'Nolan'])
      .eq('approval_status', 'approved')
      .eq('is_published', false);

    if (!publishableError && publishableVideos.length > 0) {
      console.log('\n📋 Videos that could be published:');
      publishableVideos.forEach(video => {
        console.log(`  - ${video.child_name}: ${video.video_title} (${video.template_type})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkChildVideos();
