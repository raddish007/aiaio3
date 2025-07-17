const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAndrewVideos() {
  console.log('🎬 Testing Andrew videos for parent resources page...\n');
  
  try {
    // Get Andrew's child info first
    const { data: childData } = await supabase
      .from('children')
      .select('id, name, primary_interest, age')
      .eq('name', 'Andrew')
      .single();

    console.log('👶 Andrew info:', childData);
    
    // Get videos from child_approved_videos
    const { data: videosData } = await supabase
      .from('child_approved_videos')
      .select('id, video_title, consumer_title, template_type, video_url, is_published')
      .eq('child_name', 'Andrew')
      .eq('approval_status', 'approved')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    console.log('\n📺 Videos from child_approved_videos:');
    videosData?.forEach((video, i) => {
      console.log(`  ${i+1}. ${video.template_type}: ${video.consumer_title || video.video_title}`);
    });

    // Get videos from child_playlists
    const { data: playlistData } = await supabase
      .from('child_playlists')
      .select('videos')
      .eq('child_id', childData?.id);

    console.log('\n📋 Videos from child_playlists:');
    if (playlistData && playlistData.length > 0) {
      const playlistVideos = playlistData[0]?.videos || [];
      const publishedPlaylistVideos = playlistVideos.filter(v => v.is_published);
      
      publishedPlaylistVideos.forEach((video, i) => {
        const template_type = video.title?.toLowerCase().includes('would you rather') ? 'would-you-rather' : 
                             video.title?.toLowerCase().includes('lily') ? 'positional-words' : 'general';
        console.log(`  ${i+1}. ${template_type}: ${video.title}`);
      });
    }

    // Combine and show final result
    let allVideos = [];
    if (videosData) allVideos = [...videosData];
    
    if (playlistData && playlistData.length > 0) {
      const playlistVideos = playlistData[0]?.videos || [];
      const publishedPlaylistVideos = playlistVideos
        .filter(v => v.is_published)
        .map(v => ({
          template_type: v.title?.toLowerCase().includes('would you rather') ? 'would-you-rather' : 
                        v.title?.toLowerCase().includes('lily') ? 'positional-words' : 'general',
          title: v.title,
          video_url: v.video_url
        }));
      allVideos = [...allVideos, ...publishedPlaylistVideos];
    }

    console.log(`\n✅ TOTAL VIDEOS FOR ANDREW'S PARENT PAGE: ${allVideos.length}`);
    allVideos.forEach((video, i) => {
      console.log(`  ${i+1}. ${video.template_type}: ${video.consumer_title || video.video_title || video.title}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

testAndrewVideos();
