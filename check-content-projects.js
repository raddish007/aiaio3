require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkContentProjects() {
  console.log('🔍 Checking Content Projects...\n');

  try {
    // 1. Find all assets with project_ids
    console.log('1. Finding assets with project_ids...');
    const { data: assetsWithProjects, error: assetsError } = await supabase
      .from('assets')
      .select('id, project_id, metadata->template, created_at')
      .not('project_id', 'is', null)
      .order('created_at', { ascending: false });

    if (assetsError) {
      console.error('❌ Error fetching assets:', assetsError);
      return;
    }

    console.log(`Found ${assetsWithProjects?.length || 0} assets with project_ids`);

    if (!assetsWithProjects || assetsWithProjects.length === 0) {
      console.log('No assets with project_ids found.');
      return;
    }

    // 2. Get unique project_ids
    const projectIds = [...new Set(assetsWithProjects.map(asset => asset.project_id))];
    console.log(`\n2. Found ${projectIds.length} unique project_ids:`, projectIds);

    // 3. Check which project_ids exist in content_projects
    console.log('\n3. Checking which project_ids exist in content_projects...');
    const { data: existingProjects, error: projectsError } = await supabase
      .from('content_projects')
      .select('id, metadata->template, metadata->child_name, created_at')
      .in('id', projectIds);

    if (projectsError) {
      console.error('❌ Error fetching content_projects:', projectsError);
      return;
    }

    const existingProjectIds = existingProjects?.map(p => p.id) || [];
    const missingProjectIds = projectIds.filter(id => !existingProjectIds.includes(id));

    console.log(`Found ${existingProjects?.length || 0} existing content_projects`);
    console.log(`Missing ${missingProjectIds.length} content_projects`);

    if (existingProjects && existingProjects.length > 0) {
      console.log('\nExisting content_projects:');
      existingProjects.forEach(project => {
        console.log(`- Project ${project.id}:`, {
          template: project.metadata?.template,
          child_name: project.metadata?.child_name,
          created_at: project.created_at
        });
      });
    }

    // 4. Fix existing content_projects that are missing metadata
    console.log('\n4. Fixing existing content_projects with missing metadata...');
    let fixedCount = 0;
    
    for (const project of existingProjects || []) {
      const needsFix = !project.metadata?.template || !project.metadata?.child_name;
      
      if (needsFix) {
        // Get assets for this project to extract metadata
        const projectAssets = assetsWithProjects.filter(asset => asset.project_id === project.id);
        const template = projectAssets[0]?.metadata?.template || 'wish-button';
        
        console.log(`Fixing content_project ${project.id} with template ${template}...`);
        
        const { error: updateError } = await supabase
          .from('content_projects')
          .update({
            metadata: {
              template: template,
              child_name: 'Unknown Child', // Default value
              created_at: project.created_at || new Date().toISOString()
            }
          })
          .eq('id', project.id);

        if (updateError) {
          console.error(`❌ Failed to update content_project ${project.id}:`, updateError);
        } else {
          fixedCount++;
          console.log(`✅ Fixed content_project ${project.id}`);
        }
      }
    }

    if (missingProjectIds.length > 0) {
      console.log('\nMissing project_ids:', missingProjectIds);
      
      // 4. Create missing content_projects
      console.log('\n4. Creating missing content_projects...');
      let createdCount = 0;
      
      for (const projectId of missingProjectIds) {
        // Get assets for this project to extract metadata
        const projectAssets = assetsWithProjects.filter(asset => asset.project_id === projectId);
        const template = projectAssets[0]?.metadata?.template || 'wish-button';
        
        console.log(`Creating content_project ${projectId} with template ${template}...`);
        
        const { error: createError } = await supabase
          .from('content_projects')
          .insert({
            id: projectId,
            title: `Wish Button Story - ${template}`,
            theme: 'magical',
            target_age: '5-8',
            duration: 30,
            status: 'planning',
            metadata: {
              template: template,
              child_name: 'Unknown Child', // Default value
              created_at: new Date().toISOString()
            }
          });

        if (createError) {
          console.error(`❌ Failed to create content_project ${projectId}:`, createError);
        } else {
          createdCount++;
          console.log(`✅ Created content_project ${projectId}`);
        }
      }

      console.log(`\n✅ Created ${createdCount} content_projects`);
    }

    console.log(`\n✅ Fixed ${fixedCount} existing content_projects`);

    // 6. Final verification
    console.log('\n6. Final verification...');
    const { data: finalProjects, error: finalError } = await supabase
      .from('content_projects')
      .select('id, metadata->template, metadata->child_name')
      .in('id', projectIds);

    if (!finalError) {
      console.log(`\nFinal count: ${finalProjects?.length || 0} content_projects exist for the ${projectIds.length} project_ids`);
      
      console.log('\nFinal content_projects:');
      finalProjects?.forEach(project => {
        console.log(`- Project ${project.id}:`, {
          template: project.metadata?.template,
          child_name: project.metadata?.child_name
        });
      });
    }

  } catch (error) {
    console.error('💥 Error in check script:', error);
  }
}

// Run the check function
checkContentProjects().then(() => {
  console.log('\n✅ Check complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 