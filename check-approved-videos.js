const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkApprovedVideos() {
  try {
    console.log('🔍 Checking approved videos...');
    
    // Get all approved videos
    const { data: approvedVideos, error } = await supabase
      .from('child_approved_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching approved videos:', error);
      return;
    }

    console.log(`📊 Found ${approvedVideos.length} approved videos:`);
    
    approvedVideos.forEach(video => {
      console.log(`- Child ID: ${video.child_id}, Template: ${video.template_type}, Status: ${video.status}, Created: ${video.created_at}`);
    });

    // Get all video jobs
    const { data: videoJobs, error: jobError } = await supabase
      .from('video_jobs')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (jobError) {
      console.error('❌ Error fetching video jobs:', jobError);
      return;
    }

    console.log(`\n📊 Found ${videoJobs.length} completed video jobs:`);
    
    videoJobs.forEach(job => {
      console.log(`- Child ID: ${job.child_id}, Template: ${job.template_type}, Status: ${job.status}, Created: ${job.created_at}`);
    });

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkApprovedVideos();
