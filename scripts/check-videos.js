const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVideos() {
  console.log('🎬 Checking videos in database...\n');

  try {
    // Check video assets
    console.log('📹 Video Assets:');
    const { data: videoAssets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'video')
      .order('created_at', { ascending: false });

    if (assetsError) {
      console.error('❌ Error fetching video assets:', assetsError);
    } else {
      console.log(`✅ Found ${videoAssets?.length || 0} video assets:`);
      if (videoAssets && videoAssets.length > 0) {
        videoAssets.forEach((asset, index) => {
          console.log(`   ${index + 1}. ${asset.theme}`);
          console.log(`      ID: ${asset.id}`);
          console.log(`      Status: ${asset.status}`);
          console.log(`      Tags: ${asset.tags?.join(', ') || 'none'}`);
          console.log(`      URL: ${asset.file_url ? '✅ Has URL' : '❌ No URL'}`);
          console.log(`      Created: ${new Date(asset.created_at).toLocaleString()}`);
          if (asset.metadata?.child_name) {
            console.log(`      Child: ${asset.metadata.child_name}`);
          }
          if (asset.metadata?.duration) {
            console.log(`      Duration: ${asset.metadata.duration}s`);
          }
          console.log('');
        });
      } else {
        console.log('   No video assets found');
      }
    }

    // Check content videos
    console.log('📺 Content Videos:');
    const { data: contentVideos, error: contentError } = await supabase
      .from('content')
      .select('*')
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false });

    if (contentError) {
      console.error('❌ Error fetching content videos:', contentError);
    } else {
      console.log(`✅ Found ${contentVideos?.length || 0} content videos:`);
      if (contentVideos && contentVideos.length > 0) {
        contentVideos.forEach((content, index) => {
          console.log(`   ${index + 1}. ${content.title}`);
          console.log(`      ID: ${content.id}`);
          console.log(`      Type: ${content.type}`);
          console.log(`      Status: ${content.status}`);
          console.log(`      URL: ${content.video_url ? '✅ Has URL' : '❌ No URL'}`);
          console.log(`      Created: ${new Date(content.created_at).toLocaleString()}`);
          if (content.metadata?.duration) {
            console.log(`      Duration: ${content.metadata.duration}s`);
          }
          console.log('');
        });
      } else {
        console.log('   No content videos found');
      }
    }

    // Check episodes
    console.log('📺 Episodes:');
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .order('created_at', { ascending: false });

    if (episodesError) {
      console.error('❌ Error fetching episodes:', episodesError);
    } else {
      console.log(`✅ Found ${episodes?.length || 0} episodes:`);
      if (episodes && episodes.length > 0) {
        episodes.forEach((episode, index) => {
          console.log(`   ${index + 1}. Episode ${episode.episode_number}`);
          console.log(`      ID: ${episode.id}`);
          console.log(`      Status: ${episode.status}`);
          console.log(`      Delivery Date: ${episode.delivery_date}`);
          console.log(`      Created: ${new Date(episode.created_at).toLocaleString()}`);
          console.log('');
        });
      } else {
        console.log('   No episodes found');
      }
    }

    // Summary
    const totalVideos = (videoAssets?.length || 0) + (contentVideos?.length || 0);
    const approvedVideos = (videoAssets?.filter(a => a.status === 'approved').length || 0) + 
                          (contentVideos?.filter(c => c.status === 'ready').length || 0);
    
    console.log('📊 Summary:');
    console.log(`   Total videos: ${totalVideos}`);
    console.log(`   Approved/Ready videos: ${approvedVideos}`);
    console.log(`   Episodes: ${episodes?.length || 0}`);
    
    if (approvedVideos > 0) {
      console.log('\n🎉 You have videos ready for the video player!');
      console.log('🌐 Test at: http://localhost:3001/child-videos');
    } else {
      console.log('\n⚠️ No approved videos found. Please approve some videos first.');
    }

  } catch (error) {
    console.error('❌ Error checking videos:', error);
  }
}

checkVideos(); 