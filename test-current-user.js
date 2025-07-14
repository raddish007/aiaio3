const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCurrentUser() {
  console.log('🔍 Checking current user session...\n');

  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }

    if (!session) {
      console.log('❌ No active session found');
      console.log('💡 Please log in at http://localhost:3003/login');
      return;
    }

    console.log('✅ Active session found');
    console.log(`👤 User: ${session.user.email}`);
    console.log(`🆔 User ID: ${session.user.id}\n`);

    // Get user's children
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', session.user.id)
      .order('name');

    if (childrenError) {
      console.error('❌ Error fetching children:', childrenError);
      return;
    }

    console.log(`👶 Children for ${session.user.email}:`);
    if (children && children.length > 0) {
      children.forEach((child, index) => {
        console.log(`  ${index + 1}. ${child.name} (${child.age} years, ${child.primary_interest})`);
      });
    } else {
      console.log('  No children found');
    }

    // Test dashboard API call
    console.log('\n🧪 Testing dashboard API...');
    const response = await fetch(`http://localhost:3003/api/dashboard/videos?childId=${children[0]?.id}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const data = await response.json();
    console.log(`✅ API call successful`);
    console.log(`📺 Videos returned: ${data.videos?.length || 0}`);

    if (data.videos && data.videos.length > 0) {
      console.log('\n📝 Videos found:');
      data.videos.forEach((video, index) => {
        console.log(`  ${index + 1}. ${video.title} (${video.personalization_level})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCurrentUser(); 