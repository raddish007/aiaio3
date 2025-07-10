require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { getRenderProgress } = require('@remotion/lambda/client');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const awsS3Bucket = process.env.AWS_S3_VIDEO_BUCKET || 'aiaio-videos';
const lambdaFunctionName = process.env.AWS_LAMBDA_REMOTION_FUNCTION;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

if (!lambdaFunctionName) {
  console.error('❌ Missing AWS_LAMBDA_REMOTION_FUNCTION environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRenderStatus(renderId) {
  console.log(`🔍 Checking render status for: ${renderId}\n`);

  try {
    // First, check the database record
    console.log('📊 Checking database record...');
    const { data: jobRecord, error: jobError } = await supabase
      .from('video_generation_jobs')
      .select('*')
      .eq('lambda_request_id', renderId)
      .single();

    if (jobError) {
      console.error('❌ Database error:', jobError.message);
      return;
    }

    if (!jobRecord) {
      console.log('❌ No job found with this render ID in database');
      return;
    }

    console.log('✅ Database record found:');
    console.log(`   Job ID: ${jobRecord.id}`);
    console.log(`   Status: ${jobRecord.status}`);
    console.log(`   Created: ${jobRecord.created_at}`);
    console.log(`   Submitted: ${jobRecord.submitted_at || 'Not submitted'}`);
    console.log(`   Started: ${jobRecord.started_at || 'Not started'}`);
    console.log(`   Completed: ${jobRecord.completed_at || 'Not completed'}`);
    console.log(`   Failed: ${jobRecord.failed_at || 'Not failed'}`);
    console.log(`   Output URL: ${jobRecord.output_url || 'None'}`);
    console.log(`   Error: ${jobRecord.error_message || 'None'}`);

    // Now check Remotion Lambda status
    console.log('\n🔄 Checking Remotion Lambda status...');
    try {
      const progress = await getRenderProgress({
        renderId,
        bucketName: awsS3Bucket,
        functionName: lambdaFunctionName,
        region: awsRegion
      });

      console.log('✅ Remotion Lambda status:');
      console.log(`   Done: ${progress.done}`);
      console.log(`   Progress: ${Math.round(progress.overallProgress * 100)}%`);
      console.log(`   Output File: ${progress.outputFile || 'None'}`);
      console.log(`   Fatal Error: ${progress.fatalErrorEncountered || 'None'}`);
      console.log(`   Render ID: ${progress.renderId}`);
      console.log(`   Bucket Name: ${progress.bucketName}`);
      console.log(`   Function Name: ${progress.functionName}`);

      // Check if status needs updating
      if (progress.done && progress.outputFile && jobRecord.status !== 'completed') {
        console.log('\n🔄 Updating job status to completed...');
        const { error: updateError } = await supabase
          .from('video_generation_jobs')
          .update({
            status: 'completed',
            output_url: progress.outputFile,
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobRecord.id);

        if (updateError) {
          console.error('❌ Error updating job:', updateError.message);
        } else {
          console.log('✅ Job status updated to completed');
        }
      } else if (progress.fatalErrorEncountered && jobRecord.status !== 'failed') {
        console.log('\n🔄 Updating job status to failed...');
        const { error: updateError } = await supabase
          .from('video_generation_jobs')
          .update({
            status: 'failed',
            error_message: progress.fatalErrorEncountered,
            failed_at: new Date().toISOString(),
          })
          .eq('id', jobRecord.id);

        if (updateError) {
          console.error('❌ Error updating job:', updateError.message);
        } else {
          console.log('✅ Job status updated to failed');
        }
      } else if (progress.overallProgress > 0 && jobRecord.status !== 'processing') {
        console.log('\n🔄 Updating job status to processing...');
        const { error: updateError } = await supabase
          .from('video_generation_jobs')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
          })
          .eq('id', jobRecord.id);

        if (updateError) {
          console.error('❌ Error updating job:', updateError.message);
        } else {
          console.log('✅ Job status updated to processing');
        }
      }

    } catch (lambdaError) {
      console.error('❌ Remotion Lambda status check failed:', lambdaError.message);
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Get render ID from command line argument
const renderId = process.argv[2];
if (!renderId) {
  console.error('❌ Please provide a render ID as an argument');
  console.log('Usage: node scripts/check-render-status.js <renderId>');
  process.exit(1);
}

checkRenderStatus(renderId); 