const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideoStatus() {
  try {
    // Check approved_videos table
    const { data: approvedVideos, error: approvedError } = await supabase
      .from('approved_videos')
      .select('id, video_title, child_name, approval_status, created_at, video_url')
      .ilike('video_url', '%2qkr8lo2nk%')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('=== APPROVED VIDEOS TABLE ===');
    if (approvedError) {
      console.error('Error querying approved_videos:', approvedError);
    } else {
      console.log('Found videos:', approvedVideos);
    }

    // Check video_generation_jobs table
    const { data: jobData, error: jobError } = await supabase
      .from('video_generation_jobs')
      .select('id, status, template_data, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('\n=== RECENT VIDEO GENERATION JOBS ===');
    if (jobError) {
      console.error('Error querying video_generation_jobs:', jobError);
    } else {
      jobData.forEach(job => {
        console.log(`Job ${job.id}: ${job.status} - ${job.created_at}`);
        if (job.template_data?.props?.childName) {
          console.log(`  Child: ${job.template_data.props.childName}`);
        }
      });
    }

    // Check for any videos created today
    const today = new Date().toISOString().split('T')[0];
    const { data: todayVideos, error: todayError } = await supabase
      .from('approved_videos')
      .select('id, video_title, child_name, approval_status, created_at, video_url')
      .gte('created_at', today)
      .order('created_at', { ascending: false });

    console.log('\n=== VIDEOS CREATED TODAY ===');
    if (todayError) {
      console.error('Error querying today\'s videos:', todayError);
    } else {
      console.log(`Found ${todayVideos.length} videos created today:`);
      todayVideos.forEach(video => {
        console.log(`- ${video.video_title} (${video.child_name}) - Status: ${video.approval_status}`);
        console.log(`  URL: ${video.video_url}`);
        console.log(`  Created: ${video.created_at}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkVideoStatus();
