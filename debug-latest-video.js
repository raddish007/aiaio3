require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugLatestVideo() {
  console.log('🔍 Debugging latest video publishing issue...\n');

  try {
    console.log('1. Finding the most recent video...');
    
    const { data: recentVideos, error: recentError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Error fetching recent videos:', recentError);
      return;
    }

    console.log(`Found ${recentVideos.length} recent approved videos:`);
    recentVideos.forEach((video, i) => {
      console.log(`   ${i+1}. ${video.video_title} (${video.created_at})`);
      console.log(`      ID: ${video.id}`);
      console.log(`      Child: ${video.child_name}`);
      console.log(`      Published: ${video.is_published}`);
    });

    // Check the most recent one
    const latestVideo = recentVideos[0];
    if (!latestVideo) {
      console.log('❌ No recent videos found');
      return;
    }

    console.log(`\n2. Checking assignments for latest video: "${latestVideo.video_title}"`);
    
    const { data: assignments, error: assignError } = await supabase
      .from('video_assignments')
      .select('*')
      .eq('video_id', latestVideo.id)
      .order('created_at', { ascending: false });

    if (assignError) {
      console.error('❌ Error fetching assignments:', assignError);
      return;
    }

    if (assignments.length === 0) {
      console.log('❌ No assignments found for this video');
      return;
    }

    console.log(`Found ${assignments.length} assignment(s):`);
    assignments.forEach((assignment, i) => {
      console.log(`\n   ${i+1}. Assignment ID: ${assignment.id}`);
      console.log(`      Type: ${assignment.assignment_type}`);
      console.log(`      Child ID: ${assignment.child_id || 'null (general)'}`);
      console.log(`      Status: ${assignment.status}`);
      console.log(`      Theme: ${assignment.theme || 'none'}`);
      console.log(`      Created: ${assignment.created_at}`);
      console.log(`      Publish Date: ${assignment.publish_date}`);
    });

    // Check if there's a general assignment
    const generalAssignment = assignments.find(a => a.assignment_type === 'general');
    if (generalAssignment) {
      console.log('\n⚠️  FOUND GENERAL ASSIGNMENT - This is likely the bug!');
      console.log('This means the video will appear for ALL children.');
    }

    // Check how many children this affects
    console.log('\n3. Checking affected children...');
    
    const { data: allChildren, error: childrenError } = await supabase
      .from('children')
      .select('id, name, primary_interest');

    if (childrenError) {
      console.error('❌ Error fetching children:', childrenError);
      return;
    }

    const affectedChildren = [];
    
    assignments.forEach(assignment => {
      if (assignment.assignment_type === 'general') {
        // General assignments affect all children
        affectedChildren.push(...allChildren.map(child => ({
          ...child,
          assignmentType: 'general'
        })));
      } else if (assignment.child_id) {
        // Individual assignments
        const child = allChildren.find(c => c.id === assignment.child_id);
        if (child) {
          affectedChildren.push({
            ...child,
            assignmentType: 'individual'
          });
        }
      }
    });

    // Remove duplicates
    const uniqueChildren = affectedChildren.filter((child, index, array) => 
      array.findIndex(c => c.id === child.id) === index
    );

    console.log(`Video "${latestVideo.video_title}" will appear for ${uniqueChildren.length} children:`);
    uniqueChildren.forEach((child, i) => {
      console.log(`   ${i+1}. ${child.name} (${child.primary_interest}) - ${child.assignmentType}`);
    });

    if (uniqueChildren.length > 1) {
      console.log('\n⚠️  This video is appearing for multiple children!');
      console.log('If it was intended for only one child, there\'s a bug in the publishing logic.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugLatestVideo().catch(console.error);
