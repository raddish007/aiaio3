require('dotenv').config({ path: '.env.local' });
const { getRenderProgress, getRenderMetadata } = require('@remotion/lambda/client');
const { createClient } = require('@supabase/supabase-js');

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

async function checkRenderDetails(renderId) {
  console.log(`🔍 Checking detailed render information for: ${renderId}\n`);

  try {
    // Get database record
    console.log('📊 Database Information:');
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
      console.log('❌ No job found with this render ID');
      return;
    }

    console.log(`   Job ID: ${jobRecord.id}`);
    console.log(`   Status: ${jobRecord.status}`);
    console.log(`   Template ID: ${jobRecord.template_id}`);
    console.log(`   Child Name: ${jobRecord.child_name}`);
    console.log(`   Theme: ${jobRecord.theme}`);
    console.log(`   Age: ${jobRecord.age}`);
    console.log(`   Created: ${jobRecord.created_at}`);
    console.log(`   Submitted: ${jobRecord.submitted_at}`);
    console.log(`   Output URL: ${jobRecord.output_url || 'None'}`);
    console.log(`   Error: ${jobRecord.error_message || 'None'}`);

    // Get template details
    console.log('\n📋 Template Information:');
    const { data: template, error: templateError } = await supabase
      .from('video_templates')
      .select('*')
      .eq('id', jobRecord.template_id)
      .single();

    if (templateError) {
      console.error('❌ Template error:', templateError.message);
    } else if (template) {
      console.log(`   Template Name: ${template.name}`);
      console.log(`   Template Type: ${template.type}`);
      console.log(`   Composition ID: ${template.structure?.composition_id || 'Not set'}`);
      console.log(`   Parts Count: ${template.parts?.length || 0}`);
    }

    // Get assets used in this render
    console.log('\n🎨 Assets Information:');
    if (jobRecord.assets && Array.isArray(jobRecord.assets)) {
      const assetIds = jobRecord.assets.map(asset => asset.asset_id);
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .in('id', assetIds);

      if (assetsError) {
        console.error('❌ Assets error:', assetsError.message);
      } else if (assets) {
        console.log(`   Total Assets: ${assets.length}`);
        assets.forEach((asset, index) => {
          console.log(`   Asset ${index + 1}:`);
          console.log(`     ID: ${asset.id}`);
          console.log(`     Type: ${asset.type}`);
          console.log(`     Theme: ${asset.theme}`);
          console.log(`     Status: ${asset.status}`);
          console.log(`     URL: ${asset.url || 'None'}`);
          if (asset.metadata?.letter) {
            console.log(`     Letter: ${asset.metadata.letter}`);
          }
        });
      }
    }

    // Get detailed Remotion Lambda information
    console.log('\n🔄 Remotion Lambda Details:');
    try {
      const progress = await getRenderProgress({
        renderId,
        bucketName: awsS3Bucket,
        functionName: lambdaFunctionName,
        region: awsRegion
      });

      console.log(`   Done: ${progress.done}`);
      console.log(`   Progress: ${Math.round(progress.overallProgress * 100)}%`);
      console.log(`   Output File: ${progress.outputFile || 'None'}`);
      console.log(`   Fatal Error: ${progress.fatalErrorEncountered || 'None'}`);
      console.log(`   Render ID: ${progress.renderId}`);
      console.log(`   Bucket Name: ${progress.bucketName}`);
      console.log(`   Function Name: ${progress.functionName}`);

      // Try to get render metadata
      try {
        const metadata = await getRenderMetadata({
          renderId,
          bucketName: awsS3Bucket,
          functionName: lambdaFunctionName,
          region: awsRegion
        });

        console.log('\n📊 Render Metadata:');
        console.log(`   Input Props: ${JSON.stringify(metadata.inputProps, null, 2)}`);
        console.log(`   Composition: ${metadata.composition}`);
        console.log(`   Codec: ${metadata.codec}`);
        console.log(`   Image Format: ${metadata.imageFormat}`);
        console.log(`   Frame Range: ${metadata.frameRange}`);
        console.log(`   FPS: ${metadata.fps}`);
        console.log(`   Width: ${metadata.width}`);
        console.log(`   Height: ${metadata.height}`);
      } catch (metadataError) {
        console.log('❌ Could not fetch render metadata:', metadataError.message);
      }

    } catch (lambdaError) {
      console.error('❌ Remotion Lambda error:', lambdaError.message);
    }

    // Check if there are any issues with the configuration
    console.log('\n🔍 Configuration Check:');
    console.log(`   AWS Region: ${awsRegion}`);
    console.log(`   S3 Bucket: ${awsS3Bucket}`);
    console.log(`   Lambda Function: ${lambdaFunctionName}`);
    console.log(`   Remotion Site URL: ${process.env.REMOTION_SITE_URL || 'Not set'}`);

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Get render ID from command line argument
const renderId = process.argv[2];
if (!renderId) {
  console.error('❌ Please provide a render ID as an argument');
  console.log('Usage: node scripts/check-render-details.js <renderId>');
  process.exit(1);
}

checkRenderDetails(renderId); 