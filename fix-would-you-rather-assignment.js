require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixWouldYouRatherAssignment() {
  console.log('🔧 Fixing Would You Rather video assignment...\n');

  const videoId = '33ff89cf-ada5-4664-a18f-9ab6515b723d';
  const andrewId = '87109f4e-c10c-4400-a838-0cffad09b0a5';

  try {
    console.log('1. Checking current assignment...');
    
    const { data: currentAssignments, error: currentError } = await supabase
      .from('video_assignments')
      .select('*')
      .eq('video_id', videoId);

    if (currentError) {
      console.error('❌ Error checking current assignments:', currentError);
      return;
    }

    console.log(`Found ${currentAssignments.length} current assignment(s):`);
    currentAssignments.forEach((assignment, i) => {
      console.log(`   ${i+1}. Type: ${assignment.assignment_type}, Child: ${assignment.child_id || 'null (general)'}, Status: ${assignment.status}`);
    });

    console.log('\n2. Removing general assignment...');
    
    // Remove the general assignment that's causing the issue
    const { error: deleteError } = await supabase
      .from('video_assignments')
      .delete()
      .eq('video_id', videoId)
      .eq('assignment_type', 'general')
      .is('child_id', null);

    if (deleteError) {
      console.error('❌ Error removing general assignment:', deleteError);
      return;
    }

    console.log('✅ Removed general assignment');

    console.log('\n3. Creating individual assignment for Andrew...');
    
    // Create individual assignment for Andrew only
    const { error: insertError } = await supabase
      .from('video_assignments')
      .insert({
        video_id: videoId,
        child_id: andrewId,
        assignment_type: 'individual',
        publish_date: new Date().toISOString().split('T')[0],
        status: 'published',
        published_at: new Date().toISOString(),
        assigned_by: null // You can set this to your admin user ID if needed
      });

    if (insertError) {
      console.error('❌ Error creating individual assignment:', insertError);
      return;
    }

    console.log('✅ Created individual assignment for Andrew');

    console.log('\n4. Verifying the fix...');
    
    const { data: newAssignments, error: verifyError } = await supabase
      .from('video_assignments')
      .select('*')
      .eq('video_id', videoId);

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
      return;
    }

    console.log(`Now has ${newAssignments.length} assignment(s):`);
    newAssignments.forEach((assignment, i) => {
      console.log(`   ${i+1}. Type: ${assignment.assignment_type}, Child: ${assignment.child_id || 'null (general)'}, Status: ${assignment.status}`);
    });

    console.log('\n✅ Fix completed! The Would You Rather video should now only appear for Andrew.');
    console.log('💡 Note: You may need to update child playlists to reflect this change.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixWouldYouRatherAssignment().catch(console.error);
