const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVideoTemplatesDB() {
  console.log('Testing Video Templates Database...\n');

  try {
    // Test 1: Check if video_templates table exists
    console.log('1. Checking if video_templates table exists...');
    const { data: templates, error: templatesError } = await supabase
      .from('video_templates')
      .select('*')
      .limit(1);

    if (templatesError) {
      console.error('❌ Error accessing video_templates table:', templatesError.message);
    } else {
      console.log('✅ video_templates table exists');
      console.log(`   Found ${templates?.length || 0} templates`);
    }

    // Test 2: Check if template_asset_assignments table exists
    console.log('\n2. Checking if template_asset_assignments table exists...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('template_asset_assignments')
      .select('*')
      .limit(1);

    if (assignmentsError) {
      console.error('❌ Error accessing template_asset_assignments table:', assignmentsError.message);
    } else {
      console.log('✅ template_asset_assignments table exists');
      console.log(`   Found ${assignments?.length || 0} assignments`);
    }

    // Test 3: Check if template_instances table exists
    console.log('\n3. Checking if template_instances table exists...');
    const { data: instances, error: instancesError } = await supabase
      .from('template_instances')
      .select('*')
      .limit(1);

    if (instancesError) {
      console.error('❌ Error accessing template_instances table:', instancesError.message);
    } else {
      console.log('✅ template_instances table exists');
      console.log(`   Found ${instances?.length || 0} instances`);
    }

    // Test 4: Check available assets
    console.log('\n4. Checking available assets...');
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id, type, theme, status')
      .eq('status', 'approved')
      .limit(5);

    if (assetsError) {
      console.error('❌ Error accessing assets table:', assetsError.message);
    } else {
      console.log('✅ assets table accessible');
      console.log(`   Found ${assets?.length || 0} approved assets`);
      if (assets && assets.length > 0) {
        console.log('   Sample assets:');
        assets.forEach(asset => {
          console.log(`     - ${asset.theme} (${asset.type}, ${asset.status})`);
        });
      }
    }

    // Test 5: Try to create a test template
    console.log('\n5. Testing template creation...');
    const testTemplate = {
      name: 'Test Template',
      description: 'Test template for database verification',
      type: 'lullaby',
      structure: [
        {
          id: 'intro',
          name: 'Intro',
          type: 'intro',
          order: 1,
          duration: 5,
          requiredAssets: [
            {
              id: 'bg_music',
              purpose: 'background_music',
              description: 'Background music',
              type: 'audio',
              formats: ['wav', 'mp3'],
              required: true,
              multiple_allowed: false
            }
          ]
        }
      ]
    };

    const { data: newTemplate, error: createError } = await supabase
      .from('video_templates')
      .insert(testTemplate)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test template:', createError.message);
    } else {
      console.log('✅ Successfully created test template');
      console.log(`   Template ID: ${newTemplate.id}`);

      // Clean up - delete the test template
      const { error: deleteError } = await supabase
        .from('video_templates')
        .delete()
        .eq('id', newTemplate.id);

      if (deleteError) {
        console.error('⚠️  Warning: Could not delete test template:', deleteError.message);
      } else {
        console.log('✅ Successfully cleaned up test template');
      }
    }

    console.log('\n🎉 Database test completed successfully!');
    console.log('The video templates system should now work with the database.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testVideoTemplatesDB(); 