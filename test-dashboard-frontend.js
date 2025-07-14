require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDashboardFrontend() {
  console.log('🧪 Testing Dashboard Frontend...\n');

  try {
    // 1. Get a test user and child (same as before)
    console.log('1. Getting test user and child...');
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'parent')
      .limit(1);

    if (!users || users.length === 0) {
      console.error('❌ No test users found');
      return;
    }

    const testUser = users[0];
    console.log(`✅ Found test user: ${testUser.email}`);

    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', testUser.id)
      .limit(1);

    if (!children || children.length === 0) {
      console.error('❌ No children found for test user');
      return;
    }

    const testChild = children[0];
    console.log(`✅ Found test child: ${testChild.name} (${testChild.primary_interest})`);

    // 2. Simulate the dashboard API call
    console.log('\n2. Testing dashboard API endpoint...');
    
    // Create a session token (simulating frontend auth)
    const { data: { session }, error: sessionError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: 'test123' // This might not work, but let's try
    });

    if (sessionError) {
      console.log('⚠️  Could not create session, testing with service key instead...');
      
      // Test the API logic directly
      const { data: videos, error: videosError } = await supabase
        .from('child_approved_videos')
        .select(`
          *,
          video_assignments(
            id,
            child_id,
            publish_date,
            is_active,
            metadata
          )
        `)
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .eq('video_assignments.child_id', testChild.id);

      if (videosError) {
        console.error('❌ Error fetching child-specific videos:', videosError);
      } else {
        console.log(`✅ Child-specific videos: ${videos?.length || 0}`);
      }

      // Test general videos
      const { data: generalVideos, error: generalError } = await supabase
        .from('child_approved_videos')
        .select(`
          *,
          video_assignments(
            id,
            child_id,
            publish_date,
            is_active,
            metadata
          )
        `)
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .is('video_assignments.child_id', null);

      if (generalError) {
        console.error('❌ Error fetching general videos:', generalError);
      } else {
        console.log(`✅ General videos: ${generalVideos?.length || 0}`);
        if (generalVideos && generalVideos.length > 0) {
          console.log('\n📝 General videos found:');
          generalVideos.forEach(video => {
            console.log(`  - ${video.consumer_title || video.video_title}`);
          });
        }
      }

      // Test theme-specific videos
      const { data: themeVideos, error: themeError } = await supabase
        .from('child_approved_videos')
        .select(`
          *,
          video_assignments(
            id,
            child_id,
            publish_date,
            is_active,
            metadata
          )
        `)
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .eq('personalization_level', 'theme_specific')
        .eq('child_theme', testChild.primary_interest);

      if (themeError) {
        console.error('❌ Error fetching theme videos:', themeError);
      } else {
        console.log(`✅ Theme-specific videos: ${themeVideos?.length || 0}`);
      }

      // Combine all videos
      const allVideos = [
        ...(videos || []), 
        ...(generalVideos || []), 
        ...(themeVideos || [])
      ];
      
      const uniqueVideos = allVideos.filter((video, index, self) => 
        index === self.findIndex(v => v.id === video.id)
      );

      console.log(`\n📊 Total unique videos for ${testChild.name}: ${uniqueVideos.length}`);
      
      if (uniqueVideos.length > 0) {
        console.log('\n📝 Videos that should appear in dashboard:');
        uniqueVideos.forEach(video => {
          console.log(`  - ${video.consumer_title || video.video_title} (${video.personalization_level})`);
        });
      }

    } else {
      console.log('✅ Session created successfully');
      // You could test the actual API endpoint here if needed
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDashboardFrontend(); 