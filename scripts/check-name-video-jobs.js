const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNameVideoJobs() {
  console.log('🎬 Checking recent NameVideo jobs...\n');

  try {
    // Get recent NameVideo jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('video_generation_jobs')
      .select('*')
      .eq('template_id', 'name-video') // Assuming this is the template ID
      .order('created_at', { ascending: false })
      .limit(10);

    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError.message);
      return;
    }

    if (!jobs || jobs.length === 0) {
      console.log('ℹ️ No NameVideo jobs found');
      return;
    }

    console.log(`✅ Found ${jobs.length} NameVideo jobs:\n`);

    jobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ID: ${job.id}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Created: ${new Date(job.created_at).toLocaleString()}`);
      console.log(`   Submitted: ${job.submitted_at ? new Date(job.submitted_at).toLocaleString() : 'Not submitted'}`);
      console.log(`   Started: ${job.started_at ? new Date(job.started_at).toLocaleString() : 'Not started'}`);
      console.log(`   Completed: ${job.completed_at ? new Date(job.completed_at).toLocaleString() : 'Not completed'}`);
      console.log(`   Lambda Request ID: ${job.lambda_request_id || 'None'}`);
      console.log(`   Output URL: ${job.output_url || 'None'}`);
      
      if (job.error_message) {
        console.log(`   ❌ Error: ${job.error_message}`);
      }
      
      console.log(`   Template Data:`, JSON.stringify(job.template_data, null, 2));
      console.log('');
    });

    // Check for any stuck jobs
    const stuckJobs = jobs.filter(job => 
      job.status === 'submitted' && 
      job.submitted_at && 
      (new Date() - new Date(job.submitted_at)) > 10 * 60 * 1000 // 10 minutes
    );

    if (stuckJobs.length > 0) {
      console.log(`⚠️ Found ${stuckJobs.length} potentially stuck jobs:`);
      stuckJobs.forEach(job => {
        console.log(`   - ${job.id} (submitted ${new Date(job.submitted_at).toLocaleString()})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking NameVideo jobs:', error);
  }
}

checkNameVideoJobs(); 