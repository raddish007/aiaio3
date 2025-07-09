const { supabaseAdmin } = require('../lib/supabase');

async function checkSpecificJob() {
  try {
    console.log('🔍 Checking specific job data...');
    
    const { data, error } = await supabaseAdmin
      .from('video_generation_jobs')
      .select('*')
      .eq('id', '03f748a4-cd56-43d9-8384-138a26cc3d09')
      .single();

    if (error) {
      console.error('❌ Error fetching job:', error);
      return;
    }

    console.log('✅ Job Data:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if we need to update the status
    if (data.status === 'submitted' && data.lambda_request_id) {
      console.log('\n🔄 Job is submitted but may need status update...');
      console.log('Lambda Request ID:', data.lambda_request_id);
      console.log('Output URL:', data.output_url);
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkSpecificJob(); 