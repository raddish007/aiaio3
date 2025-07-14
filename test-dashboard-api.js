require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDashboardAPI() {
  console.log('🧪 Testing Dashboard API...\n');

  try {
    // 1. Get a test user
    console.log('1. Getting test user...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'parent')
      .limit(1);

    if (usersError || !users.length) {
      console.error('❌ No test users found');
      return;
    }

    const testUser = users[0];
    console.log(`✅ Found test user: ${testUser.email}`);

    // 2. Get a child for this user
    console.log('\n2. Getting child for test user...');
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', testUser.id)
      .limit(1);

    if (childrenError || !children.length) {
      console.error('❌ No children found for test user');
      return;
    }

    const testChild = children[0];
    console.log(`✅ Found test child: ${testChild.name} (${testChild.primary_interest})`);

    // 3. Check child_approved_videos table
    console.log('\n3. Checking child_approved_videos table...');
    const { data: approvedVideos, error: approvedVideosError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('approval_status', 'approved')
      .eq('is_active', true);

    if (approvedVideosError) {
      console.error('❌ Error querying child_approved_videos:', approvedVideosError);
      return;
    }

    console.log(`✅ Found ${approvedVideos.length} approved videos`);

    // 4. Check video_assignments table
    console.log('\n4. Checking video_assignments table...');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('video_assignments')
      .select('*')
      .eq('is_active', true);

    if (assignmentsError) {
      console.error('❌ Error querying video_assignments:', assignmentsError);
      return;
    }

    console.log(`✅ Found ${assignments.length} video assignments`);

    // 5. Test the separate queries that the API uses
    console.log('\n5. Testing child-specific videos...');
    const { data: childSpecificVideos, error: childSpecificError } = await supabase
      .from('child_approved_videos')
      .select(`
        *,
        video_assignments!inner(
          id,
          child_id,
          publish_date,
          is_active,
          metadata
        )
      `)
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .eq('is_published', true)
      .eq('video_assignments.child_id', testChild.id);

    if (childSpecificError) {
      console.error('❌ Error in child-specific query:', childSpecificError);
    } else {
      console.log(`✅ Child-specific query returned ${childSpecificVideos.length} videos`);
    }

    console.log('\n6. Testing general videos...');
    const { data: generalVideos, error: generalError } = await supabase
      .from('child_approved_videos')
      .select(`
        *,
        video_assignments!inner(
          id,
          child_id,
          publish_date,
          is_active,
          metadata
        )
      `)
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .eq('is_published', true)
      .is('video_assignments.child_id', null);

    if (generalError) {
      console.error('❌ Error in general query:', generalError);
    } else {
      console.log(`✅ General query returned ${generalVideos.length} videos`);
    }

    // 7. Test theme-specific query
    console.log('\n7. Testing theme-specific query...');
    const { data: themeVideos, error: themeError } = await supabase
      .from('child_approved_videos')
      .select(`
        *,
        video_assignments!inner(
          id,
          child_id,
          publish_date,
          is_active,
          metadata
        )
      `)
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .eq('is_published', true)
      .eq('personalization_level', 'theme_specific')
      .eq('child_theme', testChild.primary_interest);

    if (themeError) {
      console.error('❌ Error in theme query:', themeError);
    } else {
      console.log(`✅ Theme query returned ${themeVideos.length} videos`);
    }

    // 8. Show sample video data
    const allVideos = [
      ...(childSpecificVideos || []), 
      ...(generalVideos || []), 
      ...(themeVideos || [])
    ];
    
    if (allVideos.length > 0) {
      console.log('\n8. Sample video data:');
      const sampleVideo = allVideos[0];
      console.log({
        id: sampleVideo.id,
        title: sampleVideo.consumer_title || sampleVideo.video_title,
        description: sampleVideo.consumer_description,
        parent_tip: sampleVideo.parent_tip,
        display_image: sampleVideo.display_image_url,
        personalization_level: sampleVideo.personalization_level,
        child_theme: sampleVideo.child_theme,
        publish_date: sampleVideo.video_assignments?.[0]?.publish_date,
        assignment_count: sampleVideo.video_assignments?.length || 0
      });
    }

    console.log('\n✅ Dashboard API test completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`- Test user: ${testUser.email}`);
    console.log(`- Test child: ${testChild.name} (${testChild.primary_interest})`);
    console.log(`- Approved videos: ${approvedVideos.length}`);
    console.log(`- Video assignments: ${assignments.length}`);
    console.log(`- Child-specific videos: ${childSpecificVideos?.length || 0}`);
    console.log(`- General videos: ${generalVideos?.length || 0}`);
    console.log(`- Theme-specific videos: ${themeVideos?.length || 0}`);
    console.log(`- Total unique videos: ${allVideos.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDashboardAPI(); 