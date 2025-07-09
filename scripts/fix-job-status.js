const { createClient } = require('@supabase/supabase-js');

// Direct environment variables
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixJobStatus() {
  console.log('🔧 Fixing job status...\n');

  const jobId = '235f8ed0-00cb-42d4-83ea-aaf98f8ee4a8';
  const outputUrl = 'https://s3.us-east-1.amazonaws.com/remotionlambda-useast1-3pwoq46nsa/renders/75uqxbgymk/out.mp4';

  try {
    // Update the job status
    const { data: updatedJob, error } = await supabase
      .from('video_generation_jobs')
      .update({
        status: 'completed',
        output_url: outputUrl,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error updating job:', error.message);
      return;
    }

    console.log('✅ Job status updated successfully!');
    console.log(`   ID: ${updatedJob.id}`);
    console.log(`   Status: ${updatedJob.status}`);
    console.log(`   Output URL: ${updatedJob.output_url}`);
    console.log(`   Completed: ${updatedJob.completed_at}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixJobStatus(); 