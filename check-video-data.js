const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideoData() {
  console.log('🎥 Checking video data for children...\n');
  try {
    // Check published videos
    const { data: videos, error: videoError } = await supabase
      .from('published_videos')
      .select('id, title, child_theme, personalization_level, duration_seconds')
      .limit(5);

    if (videoError) {
      console.error('❌ Error fetching videos:', videoError);
    } else {
      console.log(`Found ${videos?.length || 0} published videos:`);
      videos?.forEach((video, idx) => {
        console.log(`${idx + 1}. ${video.title} (${video.child_theme}, ${video.personalization_level})`);
      });
    }

    console.log('\n');

    // Check child video assignments
    const { data: assignments, error: assignError } = await supabase
      .from('child_video_assignments')
      .select('child_id, video_id, status, created_at')
      .limit(5);

    if (assignError) {
      console.error('❌ Error fetching assignments:', assignError);
    } else {
      console.log(`Found ${assignments?.length || 0} video assignments:`);
      assignments?.forEach((assignment, idx) => {
        console.log(`${idx + 1}. Child: ${assignment.child_id} -> Video: ${assignment.video_id} (${assignment.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking video data:', error);
  }
}

checkVideoData();
