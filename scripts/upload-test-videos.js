const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadTestVideos() {
  console.log('🎬 Setting up test videos for Supabase storage...\n');

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

    // Define test video data (these will be placeholder entries until you upload real files)
    const testVideos = [
      {
        theme: `${child.name}'s Bedtime Story`,
        type: 'video',
        tags: ['bedtime', 'lullaby', 'personalized'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        description: 'A calming bedtime story for ' + child.name,
        video_type: 'bedtime',
        duration: 180 // 3 minutes
      },
      {
        theme: `${child.name}'s Name Video`,
        type: 'video',
        tags: ['name', 'educational', 'personalized'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        description: 'Learn to spell your name, ' + child.name,
        video_type: 'name_video',
        duration: 60 // 1 minute
      },
      {
        theme: `${child.name}'s Adventure Time`,
        type: 'video',
        tags: ['adventure', 'fun', 'personalized'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        description: 'Join ' + child.name + ' on an amazing adventure!',
        video_type: 'adventure',
        duration: 240 // 4 minutes
      },
      {
        theme: `${child.name}'s Learning ABCs`,
        type: 'video',
        tags: ['educational', 'alphabet', 'learning'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        description: 'Learn the alphabet with ' + child.name,
        video_type: 'educational',
        duration: 120 // 2 minutes
      },
      {
        theme: `${child.name}'s Animal Friends`,
        type: 'video',
        tags: ['animals', 'fun', 'educational'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        description: 'Meet amazing animals with ' + child.name,
        video_type: 'animals',
        duration: 150 // 2.5 minutes
      },
      {
        theme: `${child.name}'s Color World`,
        type: 'video',
        tags: ['colors', 'learning', 'fun'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        description: 'Explore colors with ' + child.name,
        video_type: 'colors',
        duration: 90 // 1.5 minutes
      },
      {
        theme: `${child.name}'s Counting Fun`,
        type: 'video',
        tags: ['numbers', 'counting', 'educational'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        description: 'Learn to count with ' + child.name,
        video_type: 'numbers',
        duration: 100 // 1.67 minutes
      },
      {
        theme: `${child.name}'s Shapes Adventure`,
        type: 'video',
        tags: ['shapes', 'geometry', 'learning'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        description: 'Discover shapes with ' + child.name,
        video_type: 'shapes',
        duration: 110 // 1.83 minutes
      },
      {
        theme: `${child.name}'s Music Time`,
        type: 'video',
        tags: ['music', 'songs', 'fun'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        description: 'Sing and dance with ' + child.name,
        video_type: 'music',
        duration: 200 // 3.33 minutes
      },
      {
        theme: `${child.name}'s Good Morning`,
        type: 'video',
        tags: ['morning', 'routine', 'positive'],
        age_range: '2-5',
        safe_zone: 'center_safe',
        status: 'approved',
        description: 'Start your day with ' + child.name,
        video_type: 'morning',
        duration: 75 // 1.25 minutes
      }
    ];

    console.log('📹 Creating video database entries...');
    const createdVideos = [];

    for (let i = 0; i < testVideos.length; i++) {
      const videoData = testVideos[i];
      
      // Create a placeholder file URL (you'll replace these with real uploads)
      const placeholderUrl = `https://your-supabase-project.supabase.co/storage/v1/object/public/assets/videos/${child.name.toLowerCase()}_video_${i + 1}.mp4`;
      
      const { data: video, error: videoError } = await supabase
        .from('assets')
        .insert({
          ...videoData,
          file_url: placeholderUrl,
          metadata: {
            child_name: child.name,
            child_id: child.id,
            video_type: videoData.video_type,
            duration: videoData.duration,
            description: videoData.description,
            upload_status: 'placeholder' // This indicates it needs a real file
          }
        })
        .select()
        .single();

      if (videoError) {
        console.error(`❌ Error creating video "${videoData.theme}":`, videoError.message);
      } else {
        console.log(`✅ Created video entry: ${video.theme} (ID: ${video.id})`);
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
        video_url: 'https://your-supabase-project.supabase.co/storage/v1/object/public/assets/videos/welcome_video.mp4',
        status: 'ready',
        delivery_date: new Date().toISOString(),
        metadata: {
          video_type: 'welcome',
          duration: 120,
          upload_status: 'placeholder'
        }
      },
      {
        child_id: child.id,
        type: 'weekly_episode',
        title: `${child.name}'s First Episode`,
        description: 'Your first weekly episode with fun stories and songs!',
        video_url: 'https://your-supabase-project.supabase.co/storage/v1/object/public/assets/videos/weekly_episode_1.mp4',
        status: 'ready',
        delivery_date: new Date().toISOString(),
        metadata: {
          video_type: 'weekly_episode',
          episode_number: 1,
          duration: 300,
          segments: [
            { title: 'Welcome Song', duration: 30 },
            { title: 'Story Time', duration: 240 },
            { title: 'Goodbye Song', duration: 30 }
          ],
          upload_status: 'placeholder'
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

    console.log('\n🎉 Test video entries created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Created ${createdVideos.length} video database entries`);
    console.log(`   - Created ${testContent.length} content entries`);
    console.log(`   - All entries are marked as 'placeholder'`);
    console.log('\n📁 Next Steps:');
    console.log('1. Upload 10 real video files to your Supabase storage bucket \'assets\'');
    console.log('2. Update the file_url fields in the database with the real URLs');
    console.log('3. Change upload_status from \'placeholder\' to \'completed\'');
    console.log('\n🌐 You can now test the video player structure at:');
    console.log('   http://localhost:3001/child-videos');
    console.log('   http://localhost:3001/test-video-player');

    // Show the video IDs for easy reference
    console.log('\n📋 Video IDs for reference:');
    createdVideos.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.theme} - ID: ${video.id}`);
    });

  } catch (error) {
    console.error('❌ Error creating test videos:', error);
  }
}

uploadTestVideos(); 