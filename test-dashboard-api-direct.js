const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testDashboardAPI() {
  console.log('🧪 Testing Dashboard API directly...\n');

  try {
    // Get Erica's user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', 'erica@erica.com')
      .single();

    if (userError || !user) {
      console.error('❌ Error finding user:', userError);
      return;
    }

    console.log(`✅ Found user: erica@erica.com (${user.id})`);

    // Get Erica's children
    const { data: children, error: childrenError } = await supabaseAdmin
      .from('children')
      .select('*')
      .eq('parent_id', user.id)
      .order('name');

    if (childrenError) {
      console.error('❌ Error fetching children:', childrenError);
      return;
    }

    console.log(`👶 Children found: ${children.length}`);
    children.forEach((child, index) => {
      console.log(`  ${index + 1}. ${child.name} (${child.age} years, ${child.primary_interest})`);
    });

    if (children.length === 0) {
      console.log('❌ No children found for Erica');
      return;
    }

    // Test with the first child (Nolan)
    const testChild = children[0];
    console.log(`\n🧪 Testing with child: ${testChild.name} (${testChild.id})`);

    // Simulate the dashboard API logic exactly
    console.log('\n1. Fetching child-specific videos...');
    const { data: childSpecificVideos, error: childSpecificError } = await supabaseAdmin
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
      .eq('video_assignments.child_id', testChild.id)
      .order('created_at', { ascending: false });

    if (childSpecificError) {
      console.error('❌ Error fetching child-specific videos:', childSpecificError);
    } else {
      console.log(`✅ Child-specific videos: ${childSpecificVideos?.length || 0}`);
    }

    console.log('\n2. Fetching general videos...');
    const { data: generalVideos, error: generalError } = await supabaseAdmin
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
      .is('video_assignments.child_id', null)
      .order('created_at', { ascending: false });

    if (generalError) {
      console.error('❌ Error fetching general videos:', generalError);
    } else {
      console.log(`✅ General videos: ${generalVideos?.length || 0}`);
    }

    console.log('\n3. Fetching theme-specific videos...');
    const { data: themeVideos, error: themeVideosError } = await supabaseAdmin
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
      .eq('child_theme', testChild.primary_interest)
      .order('created_at', { ascending: false });

    if (themeVideosError) {
      console.error('❌ Error fetching theme videos:', themeVideosError);
    } else {
      console.log(`✅ Theme-specific videos: ${themeVideos?.length || 0}`);
    }

    // Combine and deduplicate videos (like the API does)
    const allVideos = [
      ...(childSpecificVideos || []), 
      ...(generalVideos || []), 
      ...(themeVideos || [])
    ];
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex(v => v.id === video.id)
    );

    console.log(`\n📺 Total unique videos: ${uniqueVideos.length}`);

    if (uniqueVideos.length > 0) {
      console.log('\n📝 Videos that should appear in dashboard:');
      uniqueVideos.forEach((video, index) => {
        const assignment = video.video_assignments?.[0];
        let type = 'unknown';
        if (assignment?.child_id === testChild.id) {
          type = 'child_specific';
        } else if (assignment?.child_id === null) {
          type = 'generic';
        } else if (video.personalization_level === 'theme_specific') {
          type = 'theme_specific';
        }
        console.log(`  ${index + 1}. ${video.consumer_title || video.video_title} (${type})`);
      });
    } else {
      console.log('❌ No videos found');
      
      // Check what's in the tables
      console.log('\n🔍 Checking database state...');
      
      const { data: allVideos, error: allVideosError } = await supabaseAdmin
        .from('child_approved_videos')
        .select('*')
        .eq('approval_status', 'approved')
        .eq('is_active', true);
      
      console.log(`Approved & active videos: ${allVideos?.length || 0}`);
      
      const { data: allAssignments, error: allAssignmentsError } = await supabaseAdmin
        .from('video_assignments')
        .select('*');
      
      console.log(`Video assignments: ${allAssignments?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDashboardAPI(); 