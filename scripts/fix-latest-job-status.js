const { createClient } = require('@supabase/supabase-js');

// Direct environment variables
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixLatestJobStatus() {
  console.log('🔧 Fixing latest job status...\n');

  try {
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

    const job = jobs[0];
    console.log('📋 Current job info:');
    console.log(`   ID: ${job.id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Lambda Request ID: ${job.lambda_request_id}`);
    console.log(`   Output URL: ${job.output_url}`);

    // Update the job status to completed
    const { data: updatedJob, error } = await supabase
      .from('video_generation_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        output_url: 'https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/vnrc5970uo/out.mp4'
      })
      .eq('id', job.id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error updating job:', error.message);
      return;
    }

    console.log('✅ Job status updated successfully!');
    console.log(`   New Status: ${updatedJob.status}`);
    console.log(`   Completed: ${updatedJob.completed_at}`);
    console.log(`   Output URL: ${updatedJob.output_url}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixLatestJobStatus(); 