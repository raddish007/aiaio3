const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestVideos() {
  console.log('🎬 Creating test videos for children...\n');

  try {
    // Get the first child from the database
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .limit(1);

    if (childrenError || !children || children.length === 0) {
      console.error('❌ No children found in database');
      return;
    }

    const child = children[0];
    console.log(`👶 Using child: ${child.name} (age ${child.age})`);

    // Create test video assets
    const testVideos = [
      {
        type: 'video',
        theme: `${child.name}'s Bedtime Story`,
        tags: ['bedtime', 'lullaby', 'personalized'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        file_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        metadata: {
          child_name: child.name,
          child_id: child.id,
          video_type: 'bedtime',
          duration: 596, // 9 minutes 56 seconds
          description: 'A personalized bedtime story for ' + child.name
        }
      },
      {
        type: 'video',
        theme: `${child.name}'s Name Video`,
        tags: ['name', 'educational', 'personalized'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        file_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        metadata: {
          child_name: child.name,
          child_id: child.id,
          video_type: 'name_video',
          duration: 10,
          description: 'Learn to spell your name, ' + child.name
        }
      },
      {
        type: 'video',
        theme: `${child.name}'s Adventure Time`,
        tags: ['adventure', 'fun', 'personalized'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        file_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        metadata: {
          child_name: child.name,
          child_id: child.id,
          video_type: 'adventure',
          duration: 653, // 10 minutes 53 seconds
          description: 'Join ' + child.name + ' on an amazing adventure!'
        }
      }
    ];

    console.log('📹 Creating video assets...');
    const createdVideos = [];

    for (const videoData of testVideos) {
      const { data: video, error: videoError } = await supabase
        .from('assets')
        .insert(videoData)
        .select()
        .single();

      if (videoError) {
        console.error(`❌ Error creating video "${videoData.theme}":`, videoError.message);
      } else {
        console.log(`✅ Created video: ${video.theme} (ID: ${video.id})`);
        createdVideos.push(video);
      }
    }

    // Create test content entries
    console.log('\n📺 Creating content entries...');
    const testContent = [
      {
        child_id: child.id,
        type: 'initial',
        title: `${child.name}'s Welcome Video`,
        description: 'Welcome to your personalized video collection!',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        status: 'ready',
        delivery_date: new Date().toISOString(),
        metadata: {
          video_type: 'welcome',
          duration: 596,
          thumbnail_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg'
        }
      },
      {
        child_id: child.id,
        type: 'weekly_episode',
        title: `${child.name}'s First Episode`,
        description: 'Your first weekly episode with fun stories and songs!',
        video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        status: 'ready',
        delivery_date: new Date().toISOString(),
        metadata: {
          video_type: 'weekly_episode',
          episode_number: 1,
          duration: 10,
          segments: [
            { title: 'Welcome Song', duration: 30 },
            { title: 'Story Time', duration: 300 },
            { title: 'Goodbye Song', duration: 30 }
          ]
        }
      }
    ];

    for (const contentData of testContent) {
      const { data: content, error: contentError } = await supabase
        .from('content')
        .insert(contentData)
        .select()
        .single();

      if (contentError) {
        console.error(`❌ Error creating content "${contentData.title}":`, contentError.message);
      } else {
        console.log(`✅ Created content: ${content.title} (ID: ${content.id})`);
      }
    }

    // Create a test episode
    console.log('\n📺 Creating test episode...');
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .insert({
        child_id: child.id,
        episode_number: 1,
        delivery_date: new Date().toISOString(),
        status: 'ready',
        assembly_log: [
          { step: 'created', timestamp: new Date().toISOString() },
          { step: 'assets_assembled', timestamp: new Date().toISOString() },
          { step: 'completed', timestamp: new Date().toISOString() }
        ]
      })
      .select()
      .single();

    if (episodeError) {
      console.error('❌ Error creating episode:', episodeError.message);
    } else {
      console.log(`✅ Created episode: Episode ${episode.episode_number} (ID: ${episode.id})`);
    }

    console.log('\n🎉 Test videos created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Created ${createdVideos.length} video assets`);
    console.log(`   - Created ${testContent.length} content entries`);
    console.log(`   - Created 1 episode`);
    console.log(`   - All videos are now available for ${child.name}`);
    console.log('\n🌐 You can now test the video player at:');
    console.log(`   http://localhost:3001/child-videos`);
    console.log(`   http://localhost:3001/test-video-player`);

  } catch (error) {
    console.error('❌ Error creating test videos:', error);
  }
}

createTestVideos(); 