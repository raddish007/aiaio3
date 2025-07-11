const { createClient } = require('@supabase/supabase-js');

// Direct environment variables
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixLambdaFunction() {
  console.log('🔧 Fixing Lambda function configuration...\n');

  // The correct Lambda function name
  const correctFunctionName = 'remotion-render-4-0-322-mem2048mb-disk2048mb-120sec';
  
  console.log('✅ Available Lambda functions:');
  console.log('   - remotion-render-4-0-322-mem2048mb-disk2048mb-120sec (latest)');
  console.log('   - remotion-render-4-0-321-mem2048mb-disk2048mb-120sec');
  console.log('   - remotion-render-4-0-321-mem2990mb-disk2048mb-900sec');
  console.log('   - remotion-render-4-0-321-mem3008mb-disk2048mb-900sec');
  console.log('   - remotion-wrapper-api');
  
  console.log(`\n🎯 Using function: ${correctFunctionName}`);
  
  console.log('\n📝 To fix this issue, you need to:');
  console.log('1. Create a .env.local file in your project root');
  console.log('2. Add the following environment variable:');
  console.log(`   AWS_LAMBDA_REMOTION_FUNCTION=${correctFunctionName}`);
  console.log('\n3. Restart your development server');
  
  console.log('\n📋 Complete .env.local file should include:');
  console.log('AWS_REGION=us-east-1');
  console.log('AWS_ACCESS_KEY_ID=your_aws_access_key_id');
  console.log('AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key');
  console.log('AWS_S3_VIDEO_BUCKET=aiaio-videos');
  console.log('AWS_S3_ASSET_BUCKET=aiaio-assets');
  console.log(`AWS_LAMBDA_REMOTION_FUNCTION=${correctFunctionName}`);
  console.log('REMOTION_SITE_URL=your_remotion_site_url');
  console.log('REMOTION_WEBHOOK_URL=your_webhook_url (optional)');
  
  console.log('\n⚠️  This is why all video generation jobs are stuck in "submitted" status!');
  console.log('   The jobs are being submitted to a non-existent Lambda function.');
}

fixLambdaFunction(); 