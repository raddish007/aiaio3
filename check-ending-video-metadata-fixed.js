const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function checkEndingVideoMetadata() {
  console.log('🔍 Checking metadata for Letter A ending video: 1010c99b-8e10-4e34-bfe9-2e3f697b457f');
  
  // Get the specific video metadata
  const { data: specificVideo, error: specificError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', '1010c99b-8e10-4e34-bfe9-2e3f697b457f')
    .single();

  if (specificError) {
    console.error('❌ Error fetching specific video:', specificError);
    return;
  }

  console.log('\n📋 Current metadata for Letter A ending video:');
  console.log('ID:', specificVideo.id);
  console.log('Title:', specificVideo.title);
  console.log('Type:', specificVideo.type);
  console.log('VideoType:', specificVideo.videoType);
  console.log('Theme:', specificVideo.theme);
  console.log('Purpose:', specificVideo.purpose);
  console.log('Status:', specificVideo.status);
  console.log('URL:', specificVideo.url);

  console.log('\n🔍 Searching for all "Letter [LETTER]" themed videos...');
  
  // Search for all videos with "Letter " theme pattern
  const { data: letterVideos, error: letterError } = await supabase
    .from('assets')
    .select('id, title, theme, videoType, purpose, status')
    .like('theme', 'Letter %')
    .order('theme');

  if (letterError) {
    console.error('❌ Error fetching letter videos:', letterError);
    return;
  }

  console.log(`\n📊 Found ${letterVideos.length} videos with "Letter [LETTER]" themes:`);
  
  // Group by theme
  const groupedByTheme = {};
  letterVideos.forEach(video => {
    if (!groupedByTheme[video.theme]) {
      groupedByTheme[video.theme] = [];
    }
    groupedByTheme[video.theme].push(video);
  });

  Object.keys(groupedByTheme).sort().forEach(theme => {
    console.log(`\n${theme}:`);
    groupedByTheme[theme].forEach(video => {
      console.log(`  - ${video.id}: ${video.title} (${video.videoType}, purpose: ${video.purpose || 'null'})`);
    });
  });

  console.log('\n🎯 Looking for videos that should be tagged as "ending"...');
  
  // Look for videos that might be ending videos but aren't tagged
  const potentialEndingVideos = letterVideos.filter(video => 
    !video.purpose || video.purpose !== 'ending'
  );

  console.log(`\n📋 Found ${potentialEndingVideos.length} videos without "ending" purpose:`);
  potentialEndingVideos.forEach(video => {
    console.log(`- ${video.theme}: ${video.id} - ${video.title} (current purpose: ${video.purpose || 'null'})`);
  });

  // Check if there are exactly 26 letter themes (A-Z)
  const uniqueThemes = [...new Set(letterVideos.map(v => v.theme))];
  console.log(`\n📈 Found ${uniqueThemes.length} unique letter themes:`);
  console.log(uniqueThemes.sort().join(', '));
}

checkEndingVideoMetadata().catch(console.error);
