require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugWouldYouRather() {
  console.log('🔍 Debugging Would You Rather video issue...\n');

  // The specific video ID you mentioned
  const videoId = '33ff89cf-ada5-4664-a18f-9ab6515b723d';
  
  // The three children IDs
  const childIds = [
    '6a248ddf-fdf0-4645-9a80-e82bf7672d70', // Nolan
    '2d1db6d7-06da-430e-ab27-1886913eb469', // Lorelei  
    '87109f4e-c10c-4400-a838-0cffad09b0a5'  // Andrew
  ];

  try {
    console.log('1. Checking the specific video record...');
    
    // Try to find the video in child_approved_videos
    const { data: video, error: videoError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      console.log('❌ Video not found in child_approved_videos table');
      console.log('Error:', videoError?.message);
    } else {
      console.log('✅ Found video:');
      console.log('   Title:', video.video_title);
      console.log('   Child Name:', video.child_name);
      console.log('   Personalization:', video.personalization_level);
      console.log('   Template Type:', video.template_type);
      console.log('   Approval Status:', video.approval_status);
      console.log('   Is Published:', video.is_published);
      console.log('   Created:', video.created_at);
    }

    console.log('\n2. Checking video assignments...');
    
    const { data: assignments, error: assignError } = await supabase
      .from('video_assignments')
      .select('*')
      .eq('video_id', videoId);

    if (assignError) {
      console.log('❌ Error checking assignments:', assignError.message);
    } else if (assignments && assignments.length > 0) {
      console.log(`✅ Found ${assignments.length} assignment(s):`);
      assignments.forEach((assignment, i) => {
        console.log(`   ${i+1}. Type: ${assignment.assignment_type}`);
        console.log(`      Child ID: ${assignment.child_id || 'null (general)'}`);
        console.log(`      Theme: ${assignment.theme || 'none'}`);
        console.log(`      Status: ${assignment.status}`);
        console.log(`      Publish Date: ${assignment.publish_date}`);
      });
    } else {
      console.log('❌ No assignments found');
    }

    console.log('\n3. Checking the three children...');
    
    for (let i = 0; i < childIds.length; i++) {
      const childId = childIds[i];
      const names = ['Nolan', 'Lorelei', 'Andrew'];
      
      const { data: child, error: childError } = await supabase
        .from('children')
        .select('*')
        .eq('id', childId)
        .single();

      if (childError || !child) {
        console.log(`❌ Child ${names[i]} not found`);
        continue;
      }

      console.log(`\n   ${child.name}:`);
      console.log(`     ID: ${childId}`);
      console.log(`     Primary Interest: ${child.primary_interest}`);
      console.log(`     Theme: ${child.theme}`);
    }

    console.log('\n4. Summary of the issue:');
    console.log('If the video has assignment_type="general" and child_id=null,');
    console.log('then it will appear for ALL children, not just Andrew.');
    console.log('For Letter A specific videos, the assignment should be:');
    console.log('- assignment_type="individual" with child_id=Andrew\'s ID, OR');
    console.log('- assignment_type="theme" with theme="Letter A"');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugWouldYouRather().catch(console.error);
