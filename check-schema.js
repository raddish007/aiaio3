require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking database schema...');
  
  // Check content_projects table structure
  const { data: projects, error: projectError } = await supabaseAdmin
    .from('content_projects')
    .select('*')
    .limit(1);

  if (projectError) {
    console.error('❌ Error fetching projects:', projectError);
  } else if (projects.length > 0) {
    console.log('✅ content_projects sample record:', Object.keys(projects[0]));
  } else {
    // Try to get table info another way
    console.log('No records in content_projects, trying insert test...');
    const { data, error } = await supabaseAdmin
      .from('content_projects')
      .insert({
        name: 'Test Project',
        // template: 'test', // This might not exist
        child_name: 'Test Child',
        theme: 'test',
        status: 'test'
      })
      .select();
    
    if (error) {
      console.error('Insert test error:', error);
    } else {
      console.log('Insert successful, columns:', Object.keys(data[0]));
      
      // Clean up test record
      await supabaseAdmin
        .from('content_projects')
        .delete()
        .eq('id', data[0].id);
    }
  }

  // Check prompts table structure  
  const { data: prompts, error: promptError } = await supabaseAdmin
    .from('prompts')
    .select('*')
    .limit(1);

  if (promptError) {
    console.error('❌ Error fetching prompts:', promptError);
  } else if (prompts.length > 0) {
    console.log('✅ prompts sample record:', Object.keys(prompts[0]));
  } else {
    console.log('No records in prompts table');
  }
}

checkSchema().catch(console.error);
