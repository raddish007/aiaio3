#!/usr/bin/env node

// Direct Supabase test to verify data access
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function testSupabaseAccess() {
  try {
    console.log('🔍 Testing Supabase access with different keys...\n');
    
    // Test with service role key (what we used for migration)
    console.log('1. Testing with SERVICE ROLE KEY:');
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: serviceVideos, error: serviceError } = await serviceSupabase
      .from('child_approved_videos')
      .select('id, child_name, template_type, video_url, approval_status')
      .eq('approval_status', 'approved')
      .limit(3);
    
    console.log('   Service Role Results:', serviceVideos?.length || 0, 'videos');
    if (serviceError) console.log('   Service Role Error:', serviceError.message);
    
    // Test with anon key (what the API likely uses)
    console.log('\n2. Testing with ANON KEY:');
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: anonVideos, error: anonError } = await anonSupabase
      .from('child_approved_videos')
      .select('id, child_name, template_type, video_url, approval_status')
      .eq('approval_status', 'approved')
      .limit(3);
    
    console.log('   Anon Key Results:', anonVideos?.length || 0, 'videos');
    if (anonError) console.log('   Anon Key Error:', anonError.message);
    
    // Test children table
    console.log('\n3. Testing children table access:');
    const { data: children, error: childrenError } = await serviceSupabase
      .from('children')
      .select('*')
      .limit(3);
    
    console.log('   Children Results:', children?.length || 0, 'children');
    if (childrenError) console.log('   Children Error:', childrenError.message);
    
    // Sample some URLs for CDN testing
    if (serviceVideos && serviceVideos.length > 0) {
      console.log('\n4. Sample video URLs:');
      serviceVideos.forEach((video, i) => {
        console.log(`   ${i + 1}. ${video.child_name} - ${video.template_type}`);
        console.log(`      URL: ${video.video_url}`);
        console.log(`      CDN-ready: ${video.video_url?.includes('aiaio3-public-videos') ? 'YES' : 'NO'}`);
        console.log();
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing Supabase access:', error);
  }
}

testSupabaseAccess();
