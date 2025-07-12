const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMissingVideosAPI() {
  try {
    console.log('🔍 DEBUGGING MISSING VIDEOS API...');
    
    // Check approved videos for lullaby template
    console.log('\n=== APPROVED LULLABY VIDEOS ===');
    const { data: approvedVideos, error: approvedError } = await supabase
      .from('child_approved_videos')
      .select(`
        id,
        child_name,
        template_type,
        approval_status,
        created_at,
        video_url
      `)
      .eq('approval_status', 'approved')
      .eq('template_type', 'lullaby');

    if (approvedError) {
      console.error('Error fetching approved videos:', approvedError);
    } else {
      console.log(`Found ${approvedVideos.length} approved lullaby videos:`);
      approvedVideos.forEach(video => {
        console.log(`- ${video.child_name}: ${video.video_url}`);
        console.log(`  Created: ${video.created_at}`);
      });
    }
    
    // Check video_jobs for lullaby
    console.log('\n=== VIDEO JOBS FOR LULLABY ===');
    const { data: videoJobs, error: jobsError } = await supabase
      .from('video_jobs')
      .select(`
        id,
        child_name,
        template_name,
        status,
        created_at,
        output_url
      `)
      .in('status', ['completed', 'approved', 'published'])
      .ilike('template_name', '%lullaby%');

    if (jobsError) {
      console.error('Error fetching video jobs:', jobsError);
    } else {
      console.log(`Found ${videoJobs.length} lullaby video jobs:`);
      videoJobs.forEach(job => {
        console.log(`- ${job.child_name}: ${job.template_name} (${job.status})`);
      });
    }

    // Check specific Lorelei records
    console.log('\n=== LORELEI RECORDS ===');
    const { data: loreleiChildren } = await supabase
      .from('children')
      .select('id, name, age, primary_interest')
      .eq('name', 'Lorelei');

    loreleiChildren.forEach(child => {
      console.log(`Lorelei ID: ${child.id}, Age: ${child.age}, Theme: ${child.primary_interest}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

debugMissingVideosAPI();
