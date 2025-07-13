const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkVideoCategorization() {
  console.log('=== CHECKING VIDEO CATEGORIZATION ===');
  
  // Get all videos with their categorization
  const { data: videos, error } = await supabase
    .from('child_approved_videos')
    .select('id, video_title, child_name, child_theme, personalization_level, template_type, consumer_title, consumer_description, metadata_status, approval_status')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${videos.length} total videos:`);
  
  // Show a sample of videos
  const sampleVideos = videos.slice(0, 10);
  sampleVideos.forEach((video, index) => {
    console.log(`\n${index + 1}. ${video.video_title}`);
    console.log(`   Child: ${video.child_name}`);
    console.log(`   Theme: ${video.child_theme}`);
    console.log(`   Personalization: ${video.personalization_level}`);
    console.log(`   Template: ${video.template_type}`);
    console.log(`   Approval Status: ${video.approval_status}`);
    console.log(`   Consumer Title: ${video.consumer_title || 'Not set'}`);
    console.log(`   Metadata Status: ${video.metadata_status || 'Not set'}`);
  });
  
  // Check personalization level distribution
  const personalizationStats = videos.reduce((acc, video) => {
    acc[video.personalization_level] = (acc[video.personalization_level] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n=== PERSONALIZATION LEVEL DISTRIBUTION ===');
  Object.entries(personalizationStats).forEach(([level, count]) => {
    console.log(`${level}: ${count} videos`);
  });
  
  // Check template type distribution
  const templateStats = videos.reduce((acc, video) => {
    acc[video.template_type] = (acc[video.template_type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n=== TEMPLATE TYPE DISTRIBUTION ===');
  Object.entries(templateStats).forEach(([type, count]) => {
    console.log(`${type}: ${count} videos`);
  });
  
  // Check approval status distribution
  const approvalStats = videos.reduce((acc, video) => {
    acc[video.approval_status] = (acc[video.approval_status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n=== APPROVAL STATUS DISTRIBUTION ===');
  Object.entries(approvalStats).forEach(([status, count]) => {
    console.log(`${status}: ${count} videos`);
  });
  
  // Check metadata status distribution
  const metadataStats = videos.reduce((acc, video) => {
    const status = video.metadata_status || 'not_set';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n=== METADATA STATUS DISTRIBUTION ===');
  Object.entries(metadataStats).forEach(([status, count]) => {
    console.log(`${status}: ${count} videos`);
  });
  
  // Check if any videos have consumer metadata
  const videosWithConsumerMetadata = videos.filter(v => v.consumer_title || v.consumer_description);
  console.log(`\n=== CONSUMER METADATA ===`);
  console.log(`Videos with consumer metadata: ${videosWithConsumerMetadata.length} out of ${videos.length}`);
  
  if (videosWithConsumerMetadata.length > 0) {
    console.log('\nSample videos with consumer metadata:');
    videosWithConsumerMetadata.slice(0, 3).forEach((video, index) => {
      console.log(`\n${index + 1}. ${video.consumer_title || video.video_title}`);
      console.log(`   Consumer Description: ${video.consumer_description ? 'Set' : 'Not set'}`);
      console.log(`   Personalization: ${video.personalization_level}`);
      console.log(`   Template: ${video.template_type}`);
    });
  }
}

checkVideoCategorization().catch(console.error); 