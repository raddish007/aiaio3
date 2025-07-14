require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPublishedVideos() {
  console.log('🔍 Checking published videos and assignments...\n');

  try {
    // Check published videos
    console.log('1. Published videos:');
    const { data: publishedVideos, error: publishedError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (publishedError) {
      console.error('❌ Error querying published videos:', publishedError);
      return;
    }

    console.log(`✅ Found ${publishedVideos.length} published videos`);

    if (publishedVideos.length > 0) {
      console.log('\n📝 Published videos:');
      publishedVideos.forEach((video, index) => {
        console.log(`\nVideo ${index + 1}:`);
        console.log(`  ID: ${video.id}`);
        console.log(`  Title: ${video.consumer_title || video.video_title}`);
        console.log(`  Personalization: ${video.personalization_level}`);
        console.log(`  Theme: ${video.child_theme}`);
        console.log(`  Consumer Title: ${video.consumer_title || 'Not set'}`);
        console.log(`  Consumer Description: ${video.consumer_description || 'Not set'}`);
        console.log(`  Parent Tip: ${video.parent_tip || 'Not set'}`);
        console.log(`  Display Image: ${video.display_image_url || 'Not set'}`);
      });
    }

    // Check video assignments for these published videos
    if (publishedVideos.length > 0) {
      console.log('\n2. Video assignments for published videos:');
      const videoIds = publishedVideos.map(v => v.id);
      
      const { data: assignments, error: assignmentsError } = await supabase
        .from('video_assignments')
        .select('*')
        .in('video_id', videoIds)
        .eq('is_active', true)
        .order('publish_date', { ascending: false });

      if (assignmentsError) {
        console.error('❌ Error querying assignments:', assignmentsError);
      } else {
        console.log(`✅ Found ${assignments.length} assignments for published videos`);
        
        if (assignments.length > 0) {
          console.log('\n📝 Assignments:');
          assignments.forEach((assignment, index) => {
            const video = publishedVideos.find(v => v.id === assignment.video_id);
            console.log(`\nAssignment ${index + 1}:`);
            console.log(`  Video: ${video?.consumer_title || video?.video_title}`);
            console.log(`  Child ID: ${assignment.child_id || 'General (null)'}`);
            console.log(`  Publish Date: ${assignment.publish_date}`);
            console.log(`  Active: ${assignment.is_active}`);
          });
        }
      }
    }

    // Check if there are any approved videos that should be published
    console.log('\n3. Approved videos not yet published:');
    const { data: unpublishedVideos, error: unpublishedError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .eq('is_published', false)
      .order('created_at', { ascending: false });

    if (unpublishedError) {
      console.error('❌ Error querying unpublished videos:', unpublishedError);
    } else {
      console.log(`✅ Found ${unpublishedVideos.length} approved videos not yet published`);
      
      if (unpublishedVideos.length > 0) {
        console.log('\n📝 Unpublished videos:');
        unpublishedVideos.slice(0, 5).forEach((video, index) => {
          console.log(`\nVideo ${index + 1}:`);
          console.log(`  ID: ${video.id}`);
          console.log(`  Title: ${video.consumer_title || video.video_title}`);
          console.log(`  Personalization: ${video.personalization_level}`);
          console.log(`  Theme: ${video.child_theme}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkPublishedVideos(); 