const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLoreleiAssignment() {
  try {
    console.log('🔧 FIXING LORELEI ASSIGNMENT STATUS...');
    
    const assignmentId = '759bbfae-49ee-4704-9a45-948831777b4f'; // Dinosaurs Lorelei assignment
    const videoUrl = 'https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/2qkr8lo2nk/out.mp4';
    
    const { error: updateError } = await supabase
      .from('child_video_assignments')
      .update({
        status: 'approved',
        output_video_url: videoUrl,
        approved_at: new Date().toISOString(),
        approved_by: '1cb80063-9b5f-4fff-84eb-309f12bd247d'
      })
      .eq('id', assignmentId);
      
    if (updateError) {
      console.error('Error updating assignment:', updateError);
    } else {
      console.log('✅ Assignment status updated successfully!');
      
      // Verify the update
      const { data: updatedAssignment } = await supabase
        .from('child_video_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();
        
      console.log('Updated assignment status:', updatedAssignment.status);
      console.log('Output video URL:', updatedAssignment.output_video_url);
      console.log('Approved at:', updatedAssignment.approved_at);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

fixLoreleiAssignment();
