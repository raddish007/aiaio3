const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    // Check video_generation_jobs table structure
    console.log('=== VIDEO GENERATION JOBS ===');
    const { data: jobData, error: jobError } = await supabase
      .from('video_generation_jobs')
      .select('id, status, template_data, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (jobError) {
      console.error('Error querying video_generation_jobs:', jobError);
    } else {
      console.log('Recent jobs:');
      jobData.forEach(job => {
        console.log(`Job ${job.id}: ${job.status} - ${job.created_at}`);
        if (job.template_data?.props?.childName) {
          console.log(`  Child: ${job.template_data.props.childName}`);
        }
      });
    }

    // Check if videos table exists instead
    console.log('\n=== CHECKING VIDEOS TABLE ===');
    const { data: videosData, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (videosError) {
      console.error('Error querying videos table:', videosError);
    } else {
      console.log('Recent videos:');
      videosData.forEach(video => {
        console.log(`Video ${video.id}: ${video.title || video.video_title} - Status: ${video.status || video.approval_status}`);
        console.log(`  URL: ${video.video_url || video.url}`);
        console.log(`  Created: ${video.created_at}`);
      });
    }

    // Check child_videos table
    console.log('\n=== CHECKING CHILD_VIDEOS TABLE ===');
    const { data: childVideosData, error: childVideosError } = await supabase
      .from('child_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (childVideosError) {
      console.error('Error querying child_videos table:', childVideosError);
    } else {
      console.log('Recent child videos:');
      childVideosData.forEach(video => {
        console.log(`Video ${video.id}: ${video.title} - Status: ${video.status}`);
        console.log(`  Child: ${video.child_name}, URL: ${video.video_url}`);
        console.log(`  Created: ${video.created_at}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
