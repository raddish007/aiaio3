const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTemplateData() {
  console.log('🔍 Checking template_data for Lullaby and Name Video...\n');
  
  // Check Lullaby videos
  const { data: lullabyVideos, error: lullabyError } = await supabase
    .from('child_approved_videos')
    .select('id, video_title, template_type, template_data')
    .eq('template_type', 'lullaby')
    .limit(3);
    
  if (lullabyError) {
    console.error('❌ Error fetching lullaby videos:', lullabyError);
  } else {
    console.log('📹 Lullaby Videos:');
    lullabyVideos?.forEach(video => {
      console.log(`  ID: ${video.id}`);
      console.log(`  Title: ${video.video_title}`);
      console.log(`  Template Data:`, JSON.stringify(video.template_data, null, 2));
      console.log('');
    });
  }
  
  // Check Name Video videos
  const { data: nameVideos, error: nameError } = await supabase
    .from('child_approved_videos')
    .select('id, video_title, template_type, template_data')
    .eq('template_type', 'name-video')
    .limit(3);
    
  if (nameError) {
    console.error('❌ Error fetching name videos:', nameError);
  } else {
    console.log('📹 Name Videos:');
    nameVideos?.forEach(video => {
      console.log(`  ID: ${video.id}`);
      console.log(`  Title: ${video.video_title}`);
      console.log(`  Template Data:`, JSON.stringify(video.template_data, null, 2));
      console.log('');
    });
  }
}

checkTemplateData().catch(console.error); 