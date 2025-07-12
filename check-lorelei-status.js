const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLoreleiStatus() {
  try {
    // Check Lorelei's child record
    console.log('=== LORELEI CHILD RECORDS ===');
    const { data: loreleiChildren, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('name', 'Lorelei')
      .order('created_at', { ascending: false });

    if (childError) {
      console.error('Error finding Lorelei:', childError);
      return;
    } else {
      console.log(`Found ${loreleiChildren.length} Lorelei records:`);
      loreleiChildren.forEach((child, index) => {
        console.log(`${index + 1}. ID: ${child.id}, Age: ${child.age}, Theme: ${child.primary_interest}, Created: ${child.created_at}`);
      });
    }

    // Use the most recent Lorelei record
    const loreleiChild = loreleiChildren[0];
    console.log(`\nUsing most recent Lorelei record: ${loreleiChild.id}`);

    // Check her video assignment
    console.log('\n=== LORELEI VIDEO ASSIGNMENT ===');
    const { data: assignment, error: assignmentError } = await supabase
      .from('child_video_assignments')
      .select('*')
      .eq('child_id', loreleiChild.id)
      .eq('template_type', 'lullaby');

    if (assignmentError) {
      console.error('Error finding assignment:', assignmentError);
    } else {
      console.log('Lorelei assignments:', assignment);
    }

    // Check her approved video
    console.log('\n=== LORELEI APPROVED VIDEO ===');
    const { data: approvedVideo, error: videoError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('child_id', loreleiChild.id)
      .eq('template_type', 'lullaby')
      .order('created_at', { ascending: false })
      .limit(1);

    if (videoError) {
      console.error('Error finding approved video:', videoError);
    } else {
      console.log('Lorelei approved video:', approvedVideo);
    }

    // Check what needs to be updated
    if (assignment && assignment.length > 0 && approvedVideo && approvedVideo.length > 0) {
      const currentAssignment = assignment[0];
      const currentVideo = approvedVideo[0];
      
      console.log('\n=== STATUS COMPARISON ===');
      console.log(`Assignment status: ${currentAssignment.status}`);
      console.log(`Video approval status: ${currentVideo.approval_status}`);
      console.log(`Video URL: ${currentVideo.video_url}`);
      
      if (currentVideo.approval_status === 'approved' && currentAssignment.status !== 'approved') {
        console.log('\n🔄 ASSIGNMENT NEEDS UPDATE!');
        console.log('The video was approved but the assignment status was not updated.');
        
        // Update the assignment
        const { error: updateError } = await supabase
          .from('child_video_assignments')
          .update({
            status: 'approved',
            output_video_url: currentVideo.video_url,
            approved_at: new Date().toISOString(),
            updated_by: 'system-sync'
          })
          .eq('id', currentAssignment.id);
          
        if (updateError) {
          console.error('Error updating assignment:', updateError);
        } else {
          console.log('✅ Assignment status updated to approved!');
        }
      } else {
        console.log('\n✅ Assignment and video status are in sync');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkLoreleiStatus();
