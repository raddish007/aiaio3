const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentJobs() {
  try {
    console.log('🔍 Checking recent video generation jobs...\n');

    const { data: jobs, error } = await supabase
      .from('video_generation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!jobs || jobs.length === 0) {
      console.log('📭 No jobs found in database');
      return;
    }

    console.log(`📊 Found ${jobs.length} recent jobs:\n`);

    jobs.forEach((job, index) => {
      console.log(`${index + 1}. Job ID: ${job.id}`);
      console.log(`   Render ID: ${job.render_id}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Created: ${job.created_at}`);
      console.log(`   Updated: ${job.updated_at}`);
      if (job.error_message) {
        console.log(`   Error: ${job.error_message}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkRecentJobs(); 