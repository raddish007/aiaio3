require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVideoStatus() {
  console.log('🔍 Checking video status in database...\n');

  try {
    // Check all videos in child_approved_videos
    console.log('1. All videos in child_approved_videos:');
    const { data: allVideos, error: allVideosError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (allVideosError) {
      console.error('❌ Error querying all videos:', allVideosError);
      return;
    }

    console.log(`✅ Found ${allVideos.length} total videos`);

    // Group by status
    const statusCounts = {};
    allVideos.forEach(video => {
      const status = video.approval_status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📊 Status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} videos`);
    });

    // Check published status
    const publishedCount = allVideos.filter(v => v.is_published).length;
    const activeCount = allVideos.filter(v => v.is_active).length;
    console.log(`\n📊 Published: ${publishedCount} videos`);
    console.log(`📊 Active: ${activeCount} videos`);

    // Show sample videos with their metadata
    if (allVideos.length > 0) {
      console.log('\n2. Sample videos:');
      allVideos.slice(0, 5).forEach((video, index) => {
        console.log(`\nVideo ${index + 1}:`);
        console.log(`  ID: ${video.id}`);
        console.log(`  Title: ${video.consumer_title || video.video_title}`);
        console.log(`  Status: ${video.approval_status}`);
        console.log(`  Published: ${video.is_published}`);
        console.log(`  Active: ${video.is_active}`);
        console.log(`  Personalization: ${video.personalization_level}`);
        console.log(`  Theme: ${video.child_theme}`);
        console.log(`  Created: ${video.created_at}`);
      });
    }

    // Check video assignments
    console.log('\n3. Video assignments:');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('video_assignments')
      .select('*')
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('❌ Error querying assignments:', assignmentsError);
    } else {
      console.log(`✅ Found ${assignments.length} video assignments`);
      
      // Group by child_id
      const assignmentCounts = {};
      assignments.forEach(assignment => {
        const childId = assignment.child_id || 'general';
        assignmentCounts[childId] = (assignmentCounts[childId] || 0) + 1;
      });

      console.log('\n📊 Assignment breakdown:');
      Object.entries(assignmentCounts).forEach(([childId, count]) => {
        const label = childId === 'general' ? 'General (null child_id)' : `Child ${childId}`;
        console.log(`  ${label}: ${count} assignments`);
      });
    }

    // Check if there are any videos that could be published
    console.log('\n4. Videos that could be published:');
    const { data: publishableVideos, error: publishableError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .eq('is_published', false);

    if (publishableError) {
      console.error('❌ Error querying publishable videos:', publishableError);
    } else {
      console.log(`✅ Found ${publishableVideos.length} approved videos that are not published`);
      
      if (publishableVideos.length > 0) {
        console.log('\n📝 To make videos appear in dashboard, you need to:');
        console.log('1. Set is_published = true for these videos');
        console.log('2. Create video_assignments for them');
        console.log('3. Ensure they have consumer metadata (title, description, etc.)');
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkVideoStatus();
