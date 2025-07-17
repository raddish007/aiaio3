require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixWouldYouRatherVideo() {
  console.log('🔧 Fixing Would You Rather video assignment...\n');

  const videoId = '33ff89cf-ada5-4664-a18f-9ab6515b723d';
  const andrewId = '87109f4e-c10c-4400-a838-0cffad09b0a5';

  try {
    console.log('1. Checking current assignments for the video...');
    
    const { data: currentAssignments, error: fetchError } = await supabase
      .from('video_assignments')
      .select('*')
      .eq('video_id', videoId);

    if (fetchError) {
      console.error('❌ Error fetching assignments:', fetchError);
      return;
    }

    console.log(`Found ${currentAssignments.length} current assignment(s):`);
    currentAssignments.forEach((assignment, i) => {
      console.log(`   ${i+1}. ID: ${assignment.id}`);
      console.log(`      Type: ${assignment.assignment_type}`);
      console.log(`      Child ID: ${assignment.child_id || 'null (general)'}`);
      console.log(`      Status: ${assignment.status}`);
    });

    // Check if there's a general assignment that needs to be removed
    const generalAssignment = currentAssignments.find(a => a.assignment_type === 'general' && a.child_id === null);
    
    if (generalAssignment) {
      console.log('\n2. Removing incorrect general assignment...');
      
      const { error: deleteError } = await supabase
        .from('video_assignments')
        .delete()
        .eq('id', generalAssignment.id);

      if (deleteError) {
        console.error('❌ Error removing general assignment:', deleteError);
        return;
      }
      
      console.log('✅ Removed general assignment');
    } else {
      console.log('\n2. No general assignment found to remove');
    }

    // Check if Andrew already has an individual assignment
    const andrewAssignment = currentAssignments.find(a => a.child_id === andrewId);
    
    if (!andrewAssignment) {
      console.log('\n3. Creating individual assignment for Andrew...');
      
      const { error: insertError } = await supabase
        .from('video_assignments')
        .insert({
          video_id: videoId,
          child_id: andrewId,
          assignment_type: 'individual',
          publish_date: new Date().toISOString().split('T')[0],
          status: 'published',
          published_at: new Date().toISOString(),
          assigned_by: null
        });

      if (insertError) {
        console.error('❌ Error creating individual assignment:', insertError);
        return;
      }
      
      console.log('✅ Created individual assignment for Andrew');
    } else {
      console.log('\n3. Andrew already has an assignment for this video');
    }

    console.log('\n4. Verifying the fix...');
    
    const { data: finalAssignments, error: verifyError } = await supabase
      .from('video_assignments')
      .select('*')
      .eq('video_id', videoId);

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
      return;
    }

    console.log(`Final state: ${finalAssignments.length} assignment(s):`);
    finalAssignments.forEach((assignment, i) => {
      console.log(`   ${i+1}. Type: ${assignment.assignment_type}`);
      console.log(`      Child ID: ${assignment.child_id || 'null (general)'}`);
      console.log(`      Status: ${assignment.status}`);
    });

    console.log('\n✅ Fix completed!');
    console.log('💡 The video should now only appear for Andrew.');
    console.log('💡 You may need to update child playlists to see the change take effect.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixWouldYouRatherVideo().catch(console.error);
