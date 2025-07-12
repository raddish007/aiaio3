const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAPILogic() {
  try {
    console.log('🧪 TESTING API LOGIC FOR LORELEI...');
    
    // Get approved videos for lullaby 
    const { data: approvedVideos, error: approvedError } = await supabase
      .from('child_approved_videos')
      .select(`
        id,
        child_name,
        template_type,
        approval_status,
        created_at,
        video_url
      `)
      .eq('approval_status', 'approved')
      .eq('template_type', 'lullaby');

    console.log('\nApproved lullaby videos:', approvedVideos);

    // Test the filtering logic for both Lorelei records
    const loreleiNames = ['Lorelei'];
    
    for (const name of loreleiNames) {
      console.log(`\n--- Testing for ${name} ---`);
      
      const childApprovedVideos = approvedVideos?.filter(video => 
        video.child_name?.toLowerCase() === name.toLowerCase()
      ) || [];
      
      console.log(`Found ${childApprovedVideos.length} approved videos for ${name}:`);
      childApprovedVideos.forEach(video => {
        console.log(`  - Template: ${video.template_type}, Created: ${video.created_at}`);
      });
      
      // Combine videos (no video_jobs in this case)
      const allChildVideos = [
        ...childApprovedVideos.map(video => ({
          created_at: video.created_at,
          source: 'approved_videos',
          template: video.template_type,
          status: video.approval_status
        }))
      ];
      
      console.log(`Total videos for ${name}: ${allChildVideos.length}`);
      
      if (allChildVideos.length === 0) {
        console.log(`❌ ${name} would be marked as missing videos`);
      } else {
        console.log(`✅ ${name} has videos and should NOT be missing`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testAPILogic();
