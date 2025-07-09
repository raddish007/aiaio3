const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔐 Testing authentication...\n');

  try {
    // Test getting current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user:', userError);
      return;
    }

    if (!user) {
      console.log('⚠️ No authenticated user found');
      console.log('💡 You need to log in first to test the video player');
      return;
    }

    console.log('✅ User authenticated:', user.email);
    console.log('   User ID:', user.id);
    
    // Test getting session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      return;
    }

    if (!session) {
      console.log('⚠️ No active session found');
      return;
    }

    console.log('✅ Active session found');
    console.log('   Access token exists:', !!session.access_token);
    
    // Test API call
    console.log('\n🌐 Testing API call...');
    
    const response = await fetch('http://localhost:3001/api/videos/list?childId=test', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('   Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful');
      console.log('   Videos found:', data.individualVideos?.length || 0);
    } else {
      const errorData = await response.json();
      console.log('❌ API call failed:', errorData.error);
    }

  } catch (error) {
    console.error('❌ Error testing auth:', error);
  }
}

testAuth(); 