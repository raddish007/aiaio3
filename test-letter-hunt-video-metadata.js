require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function examineLetterHuntVideoMetadata() {
  console.log('🔍 Examining Letter Hunt video metadata structure...\n');
  
  // Get all letter hunt videos
  const { data: videos, error } = await supabase
    .from('assets')
    .select('*')
    .eq('type', 'video')
    .eq('metadata->>template', 'letter-hunt')
    .in('status', ['approved', 'pending']);

  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }

  console.log(`📹 Found ${videos?.length || 0} Letter Hunt videos\n`);

  // Group videos by their metadata structure
  const videoTypes = {
    introVideo: [],
    intro2Video: [],
    happyDanceVideo: [],
    endingVideo: [],
    unknown: []
  };

  videos?.forEach(video => {
    const metadata = video.metadata || {};
    const videoType = metadata.videoType;
    const section = metadata.section;
    const category = metadata.category;
    const targetLetter = metadata.targetLetter;
    const theme = metadata.theme;

    // Determine the video type based on metadata
    let determinedType = 'unknown';
    
    if (videoType === 'endingVideo' || section === 'endingVideo' || category === 'endingVideo') {
      determinedType = 'endingVideo';
    } else if (videoType === 'introVideo' || section === 'introVideo' || category === 'introVideo') {
      determinedType = 'introVideo';
    } else if (videoType === 'intro2Video' || section === 'intro2Video' || category === 'intro2Video') {
      determinedType = 'intro2Video';
    } else if (videoType === 'happyDanceVideo' || section === 'happyDanceVideo' || category === 'happyDanceVideo') {
      determinedType = 'happyDanceVideo';
    }

    videoTypes[determinedType].push({
      id: video.id,
      theme: theme,
      targetLetter: targetLetter,
      videoType: videoType,
      section: section,
      category: category,
      tags: video.tags
    });
  });

  // Display results
  Object.entries(videoTypes).forEach(([type, videos]) => {
    console.log(`📋 ${type} videos (${videos.length}):`);
    videos.forEach(video => {
      console.log(`   - ${video.id}: Theme="${video.theme}", Letter="${video.targetLetter}", videoType="${video.videoType}", section="${video.section}", category="${video.category}"`);
    });
    console.log('');
  });

  // Test the filtering logic
  console.log('🧪 Testing filtering logic for different asset keys:\n');
  
  const testCases = [
    { assetKey: 'endingVideo', targetLetter: 'A' },
    { assetKey: 'introVideo', theme: 'monsters' },
    { assetKey: 'intro2Video', theme: 'monsters' },
    { assetKey: 'happyDanceVideo', theme: 'monsters' }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Testing ${testCase.assetKey}:`);
    
    let query = supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'video')
      .eq('metadata->>template', 'letter-hunt');

    if (testCase.assetKey === 'endingVideo') {
      query = query.eq('metadata->>targetLetter', testCase.targetLetter);
    } else {
      query = query.eq('metadata->>theme', testCase.theme);
      
      if (testCase.assetKey === 'introVideo') {
        query = query.or(`metadata->>videoType.eq.introVideo,metadata->>section.eq.introVideo,metadata->>category.eq.introVideo`);
      } else if (testCase.assetKey === 'intro2Video') {
        query = query.or(`metadata->>videoType.eq.intro2Video,metadata->>section.eq.intro2Video,metadata->>category.eq.intro2Video`);
      } else if (testCase.assetKey === 'happyDanceVideo') {
        query = query.or(`metadata->>videoType.eq.happyDanceVideo,metadata->>section.eq.happyDanceVideo,metadata->>category.eq.happyDanceVideo`);
      }
    }

    const { data: filteredVideos, error: filterError } = await query;

    if (filterError) {
      console.error(`   ❌ Error: ${filterError.message}`);
    } else {
      console.log(`   ✅ Found ${filteredVideos?.length || 0} videos`);
      filteredVideos?.forEach(video => {
        console.log(`      - ${video.id}: ${video.metadata?.theme} (${video.metadata?.targetLetter || 'no letter'})`);
      });
    }
    console.log('');
  }
}

examineLetterHuntVideoMetadata(); 