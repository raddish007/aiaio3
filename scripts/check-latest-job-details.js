const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestJobDetails() {
  try {
    console.log('🔍 Checking latest video generation job details...\n');

    const { data: jobs, error } = await supabase
      .from('video_generation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!jobs || jobs.length === 0) {
      console.log('📭 No jobs found in database');
      return;
    }

    const job = jobs[0];
    console.log('📊 Latest job details:');
    console.log(`   Job ID: ${job.id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Template ID: ${job.template_id}`);
    console.log(`   Submitted by: ${job.submitted_by}`);
    console.log(`   Created: ${job.created_at}`);
    console.log(`   Submitted: ${job.submitted_at || 'Not submitted'}`);
    console.log(`   Started: ${job.started_at || 'Not started'}`);
    console.log(`   Completed: ${job.completed_at || 'Not completed'}`);
    console.log(`   Failed: ${job.failed_at || 'Not failed'}`);
    console.log(`   Lambda Request ID: ${job.lambda_request_id || 'NULL'}`);
    console.log(`   Output URL: ${job.output_url || 'NULL'}`);
    console.log(`   Error Message: ${job.error_message || 'None'}`);
    
    if (job.template_data) {
      console.log(`   Template Data:`, JSON.stringify(job.template_data, null, 2));
    }

    // Check if this is a NameVideo job
    if (job.template_data?.composition === 'NameVideo') {
      console.log('\n🎬 This is a NameVideo job');
      console.log(`   Child Name: ${job.template_data.props?.childName || 'Unknown'}`);
      console.log(`   Has Background Music: ${!!job.template_data.props?.backgroundMusicUrl}`);
      console.log(`   Letter Audio Count: ${Object.keys(job.template_data.props?.audioAssets?.letters || {}).length}`);
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkLatestJobDetails(); 