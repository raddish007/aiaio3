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

async function checkRenderStatus() {
  console.log('🔍 Checking Remotion Lambda render status...\n');

  // Use the most recent render ID
  const renderId = 'yvdchldfuq';
  
  try {
    console.log(`Checking render ID: ${renderId}`);
    
    const progress = await getRenderProgress({
      renderId,
      bucketName: 'aiaio-videos',
      functionName: 'remotion-render-4-0-322-mem2048mb-disk2048mb-120sec',
      region: 'us-east-1'
    });

    console.log('📊 Render Progress:');
    console.log(`   Done: ${progress.done}`);
    console.log(`   Overall Progress: ${progress.overallProgress}`);
    console.log(`   Output File: ${progress.outputFile || 'None'}`);
    console.log(`   Fatal Error: ${progress.fatalErrorEncountered || 'None'}`);
    console.log(`   Render ID: ${progress.renderId}`);
    console.log(`   Bucket Name: ${progress.bucketName}`);
    console.log(`   Function Name: ${progress.functionName}`);
    console.log(`   Region: ${progress.region}`);
    
    if (progress.errors && progress.errors.length > 0) {
      console.log('\n❌ Errors:');
      progress.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (progress.logs && progress.logs.length > 0) {
      console.log('\n📝 Recent Logs:');
      progress.logs.slice(-5).forEach((log, index) => {
        console.log(`   ${index + 1}. ${log}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking render status:', error.message);
    console.error('Full error:', error);
  }
}

checkRenderStatus(); 