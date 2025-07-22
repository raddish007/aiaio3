const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNolanVideoPublishing() {
  console.log('🔧 Fixing Nolan video publishing issue...\n');

  const videoId = '29b6e644-a3aa-4774-87dc-33227c9b431e';
  
  try {
    // 1. Check current assignments
    console.log('1. Current assignments:');
    const { data: assignments, error: assignError } = await supabase
      .from('video_assignments')
      .select('id, assignment_type, child_id, status, is_active')
      .eq('video_id', videoId);
      
    if (assignError) {
      console.error('❌ Error checking assignments:', assignError);
      return;
    }
    
    assignments.forEach((assignment, i) => {
      console.log(`  Assignment ${i+1}:`);
      console.log(`    ID: ${assignment.id}`);
      console.log(`    Type: ${assignment.assignment_type}`);
      console.log(`    Child ID: ${assignment.child_id || 'General (null)'}`);
      console.log(`    Status: ${assignment.status}`);
      console.log(`    Active: ${assignment.is_active}`);
    });
    
    // 2. Find the general assignment that needs to be fixed
    const generalAssignment = assignments.find(a => a.child_id === null && a.assignment_type === 'general');
    
    if (generalAssignment) {
      console.log(`\n2. Found problematic general assignment: ${generalAssignment.id}`);
      console.log('   This assignment makes the video visible to ALL children');
      
      // Archive the general assignment
      console.log('\n3. Archiving the general assignment...');
      const { error: archiveError } = await supabase
        .from('video_assignments')
        .update({ 
          status: 'archived',
          is_active: false,
          archived_at: new Date().toISOString()
        })
        .eq('id', generalAssignment.id);
        
      if (archiveError) {
        console.error('❌ Error archiving general assignment:', archiveError);
        return;
      }
      
      console.log('✅ General assignment archived successfully!');
    } else {
      console.log('\n2. No general assignment found - this is good!');
    }
    
    // 3. Verify the individual assignment to Nolan exists and is active
    const nolanAssignment = assignments.find(a => 
      a.child_id === '2d1db6d7-06da-430e-ab27-1886913eb469' && 
      a.assignment_type === 'individual'
    );
    
    if (nolanAssignment) {
      console.log(`\n4. Individual assignment to Nolan: ${nolanAssignment.id}`);
      console.log(`   Status: ${nolanAssignment.status}`);
      console.log(`   Active: ${nolanAssignment.is_active}`);
      
      if (nolanAssignment.status === 'published' && nolanAssignment.is_active) {
        console.log('✅ Nolan assignment is correctly configured!');
      } else {
        console.log('⚠️ Nolan assignment may need to be activated');
      }
    } else {
      console.log('\n4. ❌ No individual assignment to Nolan found!');
      console.log('   Creating individual assignment for Nolan...');
      
      const { error: createError } = await supabase
        .from('video_assignments')
        .insert({
          video_id: videoId,
          child_id: '2d1db6d7-06da-430e-ab27-1886913eb469',
          assignment_type: 'individual',
          publish_date: new Date().toISOString().split('T')[0],
          status: 'published',
          published_at: new Date().toISOString(),
          is_active: true,
          assigned_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d' // Use the same user who made the original assignments
        });
        
      if (createError) {
        console.error('❌ Error creating Nolan assignment:', createError);
        return;
      }
      
      console.log('✅ Individual assignment to Nolan created!');
    }
    
    // 5. Final verification
    console.log('\n5. Final verification...');
    const { data: finalAssignments } = await supabase
      .from('video_assignments')
      .select('assignment_type, child_id, status, is_active')
      .eq('video_id', videoId)
      .eq('is_active', true);
      
    console.log('Active assignments after fix:');
    finalAssignments?.forEach((assignment, i) => {
      const type = assignment.child_id ? 'Individual' : 'General';
      const target = assignment.child_id ? assignment.child_id : 'All children';
      console.log(`  ${i+1}. ${type} (${assignment.status}) -> ${target}`);
    });
    
    console.log('\n🎉 Fix completed! The video should now only appear for Nolan.');
    console.log('💡 You can verify this by checking the child video players.');
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
  }
}

fixNolanVideoPublishing();
