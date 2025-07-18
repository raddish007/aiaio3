require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAfterTest() {
  console.log('🔍 Checking prompts after test API call...');
  
  const { data: prompts, error } = await supabaseAdmin
    .from('prompts')
    .select('*')
    .eq('metadata->>template', 'wish-button')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching prompts:', error);
    return;
  }

  console.log(`📊 Found ${prompts.length} wish-button prompts total`);
  
  if (prompts.length > 0) {
    console.log('✅ Latest prompt:', {
      id: prompts[0].id,
      asset_type: prompts[0].asset_type,
      page: prompts[0].metadata?.page,
      created_at: prompts[0].created_at,
      project_id: prompts[0].project_id
    });
  }

  // Check content_projects table too (using metadata query since template column doesn't exist)
  const { data: projects, error: projectError } = await supabaseAdmin
    .from('content_projects')
    .select('*')
    .eq('metadata->>template', 'wish-button')
    .order('created_at', { ascending: false });

  if (projectError) {
    console.error('❌ Error fetching projects:', projectError);
    return;
  }

  console.log(`📊 Found ${projects.length} wish-button projects`);
  if (projects.length > 0) {
    console.log('✅ Latest project:', {
      id: projects[0].id,
      title: projects[0].title,
      child_name: projects[0].metadata?.child_name,
      status: projects[0].status,
      created_at: projects[0].created_at
    });
  }
}

checkAfterTest().catch(console.error);
