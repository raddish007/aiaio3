require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearJobQueue() {
  console.log('🧹 Clearing job queue...');

  try {
    // Get all jobs that are stuck in submitted or processing status
    const { data: stuckJobs, error: fetchError } = await supabase
      .from('video_generation_jobs')
      .select('id, status, created_at, lambda_request_id')
      .in('status', ['submitted', 'processing'])
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching stuck jobs:', fetchError);
      return;
    }

    if (!stuckJobs || stuckJobs.length === 0) {
      console.log('✅ No stuck jobs found');
      return;
    }

    console.log(`📊 Found ${stuckJobs.length} stuck jobs:`);
    stuckJobs.forEach(job => {
      console.log(`   - Job ID: ${job.id}`);
      console.log(`     Status: ${job.status}`);
      console.log(`     Created: ${job.created_at}`);
      console.log(`     Lambda ID: ${job.lambda_request_id || 'N/A'}`);
    });

    // Update all stuck jobs to failed status
    const { data: updateResult, error: updateError } = await supabase
      .from('video_generation_jobs')
      .update({ 
        status: 'failed',
        error_message: 'Job cleared from queue due to system issues'
      })
      .in('status', ['submitted', 'processing']);

    if (updateError) {
      console.error('❌ Error updating jobs:', updateError);
      return;
    }

    console.log(`✅ Successfully cleared ${stuckJobs.length} jobs from queue`);
    console.log('🎯 New jobs should now be able to process');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
clearJobQueue()
  .then(() => {
    console.log('🏁 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 