const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkApprovalTables() {
  try {
    console.log('=== CHECKING CHILD_APPROVED_VIDEOS TABLE ===');
    const { data: childApprovedData, error: childApprovedError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (childApprovedError) {
      console.error('Error querying child_approved_videos:', childApprovedError);
    } else {
      console.log(`Found ${childApprovedData.length} records in child_approved_videos:`);
      childApprovedData.forEach(video => {
        console.log(`Video: ${video.video_title} - Status: ${video.approval_status}`);
        console.log(`  Child: ${video.child_name}, URL: ${video.video_url}`);
        console.log(`  Created: ${video.created_at}`);
        console.log('  ---');
      });
    }

    // Also check for the specific video URL
    console.log('\n=== SEARCHING FOR SPECIFIC VIDEO ===');
    const { data: specificVideo, error: specificError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .ilike('video_url', '%2qkr8lo2nk%');

    if (specificError) {
      console.error('Error searching for specific video:', specificError);
    } else {
      if (specificVideo.length > 0) {
        console.log('Found the specific video:');
        specificVideo.forEach(video => {
          console.log(`  Title: ${video.video_title}`);
          console.log(`  Status: ${video.approval_status}`);
          console.log(`  Child: ${video.child_name}`);
          console.log(`  URL: ${video.video_url}`);
          console.log(`  Created: ${video.created_at}`);
        });
      } else {
        console.log('❌ The specific video was not found in child_approved_videos table');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkApprovalTables();
