const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTemplateErrors() {
  console.log('Debugging Template Database Errors...\n');

  try {
    // Test 1: Check the exact schema of video_templates table
    console.log('1. Checking video_templates schema...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'video_templates')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Error checking schema:', columnsError);
    } else {
      console.log('✅ video_templates columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Test 2: Try to create a template with minimal data
    console.log('\n2. Testing template creation with minimal data...');
    const minimalTemplate = {
      name: 'Test Template',
      description: 'Test',
      type: 'lullaby',
      structure: []
    };

    const { data: newTemplate, error: createError } = await supabase
      .from('video_templates')
      .insert(minimalTemplate)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating minimal template:', createError);
      console.error('   Details:', JSON.stringify(createError, null, 2));
    } else {
      console.log('✅ Successfully created minimal template');
      console.log(`   Template ID: ${newTemplate.id}`);

      // Test 3: Try to create an assignment
      console.log('\n3. Testing assignment creation...');
      const testAssignment = {
        template_id: newTemplate.id,
        asset_purpose: 'background_music',
        assigned_asset_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        assigned_by: null
      };

      const { data: newAssignment, error: assignmentError } = await supabase
        .from('template_asset_assignments')
        .insert(testAssignment)
        .select()
        .single();

      if (assignmentError) {
        console.error('❌ Error creating assignment:', assignmentError);
        console.error('   Details:', JSON.stringify(assignmentError, null, 2));
      } else {
        console.log('✅ Successfully created assignment');
      }

      // Clean up
      await supabase.from('video_templates').delete().eq('id', newTemplate.id);
    }

    // Test 4: Check if there are any existing templates
    console.log('\n4. Checking existing templates...');
    const { data: existingTemplates, error: fetchError } = await supabase
      .from('video_templates')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching templates:', fetchError);
    } else {
      console.log(`✅ Found ${existingTemplates?.length || 0} existing templates`);
      if (existingTemplates && existingTemplates.length > 0) {
        console.log('   Sample template:', JSON.stringify(existingTemplates[0], null, 2));
      }
    }

    // Test 5: Check RLS policies
    console.log('\n5. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_name', 'video_templates')
      .eq('table_schema', 'public');

    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      console.log(`✅ Found ${policies?.length || 0} RLS policies for video_templates`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policy_name}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`);
      });
    }

    // Test 6: Check if we can access with regular client (non-admin)
    console.log('\n6. Testing with regular client...');
    const regularSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: regularTemplates, error: regularError } = await regularSupabase
      .from('video_templates')
      .select('*')
      .limit(1);

    if (regularError) {
      console.error('❌ Error with regular client:', regularError);
      console.error('   Details:', JSON.stringify(regularError, null, 2));
    } else {
      console.log('✅ Regular client can access templates');
    }

  } catch (error) {
    console.error('❌ Debug failed with error:', error);
  }
}

debugTemplateErrors(); 