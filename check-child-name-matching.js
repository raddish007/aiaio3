const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkChildNameMatching() {
  try {
    console.log('🔍 Checking child name matching...');
    
    // Get all children
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, name, age, primary_interest')
      .order('name');

    if (childrenError) {
      console.error('❌ Error fetching children:', childrenError);
      return;
    }

    console.log(`📊 Found ${children.length} children in database:`);
    children.forEach(child => {
      console.log(`- ID: ${child.id}, Name: "${child.name}", Age: ${child.age}, Interest: ${child.primary_interest}`);
    });

    // Get approved videos with distinct child names
    const { data: approvedVideos, error: approvedError } = await supabase
      .from('child_approved_videos')
      .select('child_id, child_name, template_type, approval_status, created_at')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });

    if (approvedError) {
      console.error('❌ Error fetching approved videos:', approvedError);
      return;
    }

    console.log(`\n📊 Found ${approvedVideos.length} approved videos:`);
    
    // Group by child_name
    const videosByChild = {};
    approvedVideos.forEach(video => {
      const key = video.child_name;
      if (!videosByChild[key]) {
        videosByChild[key] = [];
      }
      videosByChild[key].push(video);
    });

    console.log('\n📄 Videos grouped by child name:');
    Object.entries(videosByChild).forEach(([childName, videos]) => {
      console.log(`- "${childName}": ${videos.length} videos (child_id: ${videos[0].child_id})`);
      
      // Check if this child name matches any in the children table
      const matchingChild = children.find(c => c.name.toLowerCase() === childName.toLowerCase());
      if (matchingChild) {
        console.log(`  ✅ Matches child ID: ${matchingChild.id}`);
      } else {
        console.log(`  ❌ No matching child found in children table`);
      }
    });

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkChildNameMatching();
