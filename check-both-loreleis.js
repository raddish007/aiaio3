const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBothLoreleis() {
  try {
    const loreleiId1 = '6a248ddf-fdf0-4645-9a80-e82bf7672d70'; // Age 3, pirates
    const loreleiId2 = 'dfbe9265-c18d-4f7d-bc24-110ce44c31f7'; // Age 4, dinosaurs

    console.log('=== CHECKING BOTH LORELEI RECORDS ===');
    
    for (const [index, loreleiId] of [loreleiId1, loreleiId2].entries()) {
      console.log(`\n--- LORELEI ${index + 1} (${loreleiId}) ---`);
      
      // Get child details
      const { data: child } = await supabase
        .from('children')
        .select('*')
        .eq('id', loreleiId)
        .single();
      
      console.log(`Child: Age ${child.age}, Theme: ${child.primary_interest}`);
      
      // Check assignments
      const { data: assignments } = await supabase
        .from('child_video_assignments')
        .select('*')
        .eq('child_id', loreleiId);
      
      console.log(`Assignments: ${assignments?.length || 0}`);
      assignments?.forEach(assignment => {
        console.log(`  - ${assignment.template_type}: ${assignment.status}`);
      });
      
      // Check approved videos
      const { data: videos } = await supabase
        .from('child_approved_videos')
        .select('*')
        .eq('child_id', loreleiId);
      
      console.log(`Approved videos: ${videos?.length || 0}`);
      videos?.forEach(video => {
        console.log(`  - ${video.template_type}: ${video.approval_status} (${video.video_title})`);
      });
    }

    // Now let's check if there's a video for the dinosaurs Lorelei that needs to update an assignment
    console.log('\n=== LOOKING FOR MISMATCHED ASSIGNMENT ===');
    
    // Check if the dinosaurs Lorelei has any assignment that needs updating
    const { data: dinosaursAssignment } = await supabase
      .from('child_video_assignments')
      .select('*')
      .eq('child_id', loreleiId2)
      .eq('template_type', 'lullaby');
    
    const { data: dinosaursVideo } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('child_id', loreleiId2)
      .eq('template_type', 'lullaby')
      .eq('approval_status', 'approved');
    
    console.log('Dinosaurs Lorelei assignment:', dinosaursAssignment);
    console.log('Dinosaurs Lorelei approved video:', dinosaursVideo);
    
    if (dinosaursVideo && dinosaursVideo.length > 0 && dinosaursAssignment && dinosaursAssignment.length > 0) {
      const assignment = dinosaursAssignment[0];
      const video = dinosaursVideo[0];
      
      if (assignment.status !== 'approved') {
        console.log('\n🔄 UPDATING DINOSAURS LORELEI ASSIGNMENT...');
        const { error: updateError } = await supabase
          .from('child_video_assignments')
          .update({
            status: 'approved',
            output_video_url: video.video_url,
            approved_at: new Date().toISOString(),
            updated_by: 'system-sync'
          })
          .eq('id', assignment.id);
          
        if (updateError) {
          console.error('Error updating assignment:', updateError);
        } else {
          console.log('✅ Dinosaurs Lorelei assignment updated to approved!');
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkBothLoreleis();
