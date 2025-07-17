
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchAndrewVideos() {
  console.log('🔍 Searching for all Andrew videos with would you rather or lily...');
  
  const { data, error } = await supabase
    .from('child_approved_videos')
    .select('*')
    .eq('child_name', 'Andrew')
    .or('video_title.ilike.%would%,video_title.ilike.%lily%,consumer_title.ilike.%would%,consumer_title.ilike.%lily%');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Found videos:', data?.length || 0);
  data?.forEach(video => {
    console.log('  -', video.template_type + ':', video.video_title || video.consumer_title, '(' + video.approval_status + ')');
  });
}

searchAndrewVideos();

