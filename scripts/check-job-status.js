require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobStatus(renderIdArg) {
  console.log('Checking video generation job status...\n');

  try {
    let job;
    if (renderIdArg) {
      // Find job by lambda_request_id
      const { data: jobs, error: jobsError } = await supabase
        .from('video_generation_jobs')
        .select('*')
        .eq('lambda_request_id', renderIdArg)
        .limit(1);
      if (jobsError) {
        console.error('❌ Error fetching jobs:', jobsError.message);
        return;
      }
      if (!jobs || jobs.length === 0) {
        console.log('No job found for renderId:', renderIdArg);
        return;
      }
      job = jobs[0];
    } else {
      // Get the most recent job
      const { data: jobs, error: jobsError } = await supabase
        .from('video_generation_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (jobsError) {
        console.error('❌ Error fetching jobs:', jobsError.message);
        return;
      }
      if (!jobs || jobs.length === 0) {
        console.log('No jobs found');
        return;
      }
      job = jobs[0];
    }

    console.log('Job:');
    console.log(`  ID: ${job.id}`);
    console.log(`  Status: ${job.status}`);
    console.log(`  Created: ${job.created_at}`);
    console.log(`  Submitted: ${job.submitted_at || 'Not submitted'}`);
    console.log(`  Started: ${job.started_at || 'Not started'}`);
    console.log(`  Completed: ${job.completed_at || 'Not completed'}`);
    console.log(`  Failed: ${job.failed_at || 'Not failed'}`);
    console.log(`  Lambda Request ID: ${job.lambda_request_id || 'None'}`);
    console.log(`  Output URL: ${job.output_url || 'None'}`);
    console.log(`  Error: ${job.error_message || 'None'}`);

    // If we have a render ID, check Remotion status
    if (job.lambda_request_id) {
      console.log('\nChecking Remotion Lambda status...');
      try {
        const response = await fetch(`http://localhost:3000/api/videos/status/${job.lambda_request_id}`);
        const statusData = await response.json();
        
        if (response.ok) {
          console.log('Remotion Status:');
          console.log(`  Status: ${statusData.status}`);
          console.log(`  Progress: ${Math.round(statusData.progress * 100)}%`);
          console.log(`  Done: ${statusData.done}`);
          console.log(`  Output URL: ${statusData.output_url || 'None'}`);
          console.log(`  Error: ${statusData.error || 'None'}`);
        } else {
          console.log('❌ Status check failed:', statusData.error);
        }
      } catch (error) {
        console.log('❌ Could not check Remotion status:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

const renderIdArg = process.argv[2];
checkJobStatus(renderIdArg); 