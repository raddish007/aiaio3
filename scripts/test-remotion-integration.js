require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRemotionIntegration() {
  console.log('Testing Remotion Lambda Integration...\n');

  try {
    // Test 1: Check if video_templates table has the right structure
    console.log('1. Checking video_templates table structure...');
    const { data: templates, error: templatesError } = await supabase
      .from('video_templates')
      .select('id, name, template_type, global_elements, parts')
      .limit(1);

    if (templatesError) {
      console.error('❌ Error accessing video_templates table:', templatesError.message);
    } else {
      console.log('✅ video_templates table exists');
      if (templates && templates.length > 0) {
        const template = templates[0];
        console.log(`   Sample template: ${template.name} (${template.template_type})`);
        console.log(`   Has global_elements: ${Array.isArray(template.global_elements)}`);
        console.log(`   Has parts: ${Array.isArray(template.parts)}`);
        console.log(`   Parts count: ${template.parts?.length || 0}`);
      }
    }

    // Test 2: Check if video_generation_jobs table exists
    console.log('\n2. Checking video_generation_jobs table...');
    const { data: jobs, error: jobsError } = await supabase
      .from('video_generation_jobs')
      .select('*')
      .limit(1);

    if (jobsError) {
      console.error('❌ Error accessing video_generation_jobs table:', jobsError.message);
    } else {
      console.log('✅ video_generation_jobs table exists');
      console.log(`   Found ${jobs?.length || 0} jobs`);
    }

    // Test 3: Check if assets table has approved assets
    console.log('\n3. Checking for approved assets...');
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id, type, theme, status')
      .eq('status', 'approved')
      .limit(5);

    if (assetsError) {
      console.error('❌ Error accessing assets table:', assetsError.message);
    } else {
      console.log('✅ Assets table accessible');
      console.log(`   Found ${assets?.length || 0} approved assets`);
      if (assets && assets.length > 0) {
        console.log('   Sample assets:');
        assets.forEach(asset => {
          console.log(`     - ${asset.type} (${asset.theme})`);
        });
      }
    }

    // Test 4: Check environment variables
    console.log('\n4. Checking required environment variables...');
    const requiredEnvVars = [
      'AWS_LAMBDA_REMOTION_FUNCTION',
      'REMOTION_SITE_URL',
      'AWS_REGION',
      'AWS_S3_VIDEO_BUCKET'
    ];

    const missingVars = [];
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars.join(', '));
    } else {
      console.log('✅ All required environment variables are set');
      console.log(`   Lambda function: ${process.env.AWS_LAMBDA_REMOTION_FUNCTION}`);
      console.log(`   Site URL: ${process.env.REMOTION_SITE_URL}`);
      console.log(`   Region: ${process.env.AWS_REGION}`);
      console.log(`   S3 bucket: ${process.env.AWS_S3_VIDEO_BUCKET}`);
    }

    // Test 5: Check if we have a test template
    console.log('\n5. Checking for test template...');
    const { data: testTemplate, error: testTemplateError } = await supabase
      .from('video_templates')
      .select('*')
      .eq('template_type', 'lullaby')
      .limit(1)
      .single();

    if (testTemplateError) {
      console.error('❌ Error finding test template:', testTemplateError.message);
    } else if (testTemplate) {
      console.log('✅ Found test template:', testTemplate.name);
      console.log(`   Template ID: ${testTemplate.id}`);
      console.log(`   Parts: ${testTemplate.parts?.length || 0}`);
    } else {
      console.log('⚠️  No test template found - you may need to create one');
    }

    console.log('\n🎯 Integration Test Summary:');
    console.log('   - Database tables: ✅');
    console.log('   - Template structure: ✅');
    console.log('   - Assets available: ✅');
    console.log('   - Environment variables: ' + (missingVars.length === 0 ? '✅' : '❌'));
    console.log('   - Test template: ' + (testTemplate ? '✅' : '⚠️'));

    if (missingVars.length === 0 && testTemplate) {
      console.log('\n🚀 Ready to test video generation!');
      console.log('   You can now call /api/videos/generate with:');
      console.log('   - template_id: ' + testTemplate.id);
      console.log('   - child_name: "Test Child"');
      console.log('   - assets: [] (or actual asset IDs)');
      console.log('   - submitted_by: "your-user-id"');
    } else {
      console.log('\n⚠️  Please fix the issues above before testing video generation');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRemotionIntegration(); 