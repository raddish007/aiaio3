require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugWishButtonAssets() {
  console.log('🔍 Debugging Wish Button Asset Generation...\n');

  try {
    // 1. Check all content projects
    console.log('1. Checking all content projects...');
    const { data: allProjects, error: allProjectsError } = await supabase
      .from('content_projects')
      .select('id, title, theme, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allProjectsError) {
      console.error('❌ Error fetching all projects:', allProjectsError);
      return;
    }

    console.log(`Found ${allProjects?.length || 0} total content projects`);
    if (allProjects && allProjects.length > 0) {
      console.log('\nAll projects:');
      allProjects.forEach(project => {
        console.log(`- Project ${project.id}:`, {
          template: project.metadata?.template,
          child_name: project.metadata?.child_name,
          created_at: project.created_at
        });
      });
    }

    // 2. Check for wish-button projects specifically
    console.log('\n2. Checking for wish-button projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('content_projects')
      .select('id, title, theme, metadata, created_at')
      .eq('metadata->>template', 'wish-button')
      .order('created_at', { ascending: false })
      .limit(5);

    if (projectsError) {
      console.error('❌ Error fetching wish-button projects:', projectsError);
      return;
    }

    console.log(`Found ${projects?.length || 0} wish-button projects`);
    if (projects && projects.length > 0) {
      console.log('Latest wish-button project:', {
        id: projects[0].id,
        child_name: projects[0].metadata?.child_name,
        created_at: projects[0].created_at
      });
    }

    // 3. Check all assets to see if any have wish-button template
    console.log('\n3. Checking all assets for wish-button template...');
    const { data: allAssets, error: allAssetsError } = await supabase
      .from('assets')
      .select('id, type, metadata->template, metadata->asset_purpose, metadata->page, status, url, project_id')
      .eq('metadata->>template', 'wish-button')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allAssetsError) {
      console.error('❌ Error fetching wish-button assets:', allAssetsError);
      return;
    }

    console.log(`Found ${allAssets?.length || 0} assets with wish-button template`);
    if (allAssets && allAssets.length > 0) {
      console.log('\nWish-button assets:');
      allAssets.forEach(asset => {
        console.log(`- Asset ${asset.id}:`, {
          type: asset.type,
          status: asset.status,
          asset_purpose: asset.metadata?.asset_purpose,
          page: asset.metadata?.page,
          project_id: asset.project_id,
          url: asset.url ? 'Has URL' : 'No URL'
        });
      });
    }

    // 4. Check all assets without template filter to see what exists
    console.log('\n4. Checking all assets (no template filter)...');
    const { data: allAssetsNoFilter, error: allAssetsNoFilterError } = await supabase
      .from('assets')
      .select('id, type, metadata->template, metadata->asset_purpose, metadata->page, status, url, project_id')
      .order('created_at', { ascending: false })
      .limit(20);

    if (allAssetsNoFilterError) {
      console.error('❌ Error fetching all assets:', allAssetsNoFilterError);
      return;
    }

    console.log(`Found ${allAssetsNoFilter?.length || 0} total assets`);
    if (allAssetsNoFilter && allAssetsNoFilter.length > 0) {
      console.log('\nRecent assets:');
      allAssetsNoFilter.forEach(asset => {
        console.log(`- Asset ${asset.id}:`, {
          type: asset.type,
          status: asset.status,
          template: asset.metadata?.template,
          asset_purpose: asset.metadata?.asset_purpose,
          page: asset.metadata?.page,
          project_id: asset.project_id,
          url: asset.url ? 'Has URL' : 'No URL'
        });
      });
    }

  } catch (error) {
    console.error('💥 Error in debug script:', error);
  }
}

// Run the debug function
debugWishButtonAssets().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 