const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function examineTableStructure() {
  console.log('🔍 Examining the assets table structure...');
  
  // Get one record to see all available columns
  const { data: sample, error } = await supabase
    .from('assets')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error fetching sample:', error);
    return;
  }

  console.log('\n📋 Available columns in assets table:');
  Object.keys(sample).forEach(key => {
    console.log(`- ${key}: ${typeof sample[key]} ${Array.isArray(sample[key]) ? '(array)' : ''}`);
  });

  console.log('\n🎯 Sample metadata structure:');
  console.log(JSON.stringify(sample.metadata, null, 2));

  console.log('\n💡 Proposed solutions:');
  console.log('1. Add videoType="endingVideo" to metadata (already done for Letter A)');
  console.log('2. Update tags array to include "ending"');
  console.log('3. Use a different field to identify ending videos');

  console.log('\n🔍 Let me check which Letter videos have endingVideo in metadata...');
  
  // Find all Letter videos with endingVideo in metadata
  const { data: letterVideos, error: letterError } = await supabase
    .from('assets')
    .select('id, theme, metadata, tags')
    .like('theme', 'Letter %')
    .eq('type', 'video');

  if (letterError) {
    console.error('❌ Error fetching letter videos:', letterError);
    return;
  }

  const endingVideos = letterVideos.filter(video => {
    const isSimpleLetterTheme = /^Letter [A-Z]$/.test(video.theme);
    const hasEndingVideoType = video.metadata && video.metadata.videoType === 'endingVideo';
    return isSimpleLetterTheme && hasEndingVideoType;
  });

  console.log(`\n📊 Found ${endingVideos.length} videos with videoType="endingVideo":`);
  endingVideos.forEach(video => {
    console.log(`- ${video.theme}: ${video.id}`);
    console.log(`  - Tags: [${video.tags.join(', ')}]`);
    console.log(`  - VideoType: ${video.metadata?.videoType}`);
  });

  // Check how many single letter themes we should have (A-Z = 26)
  const allSimpleLetterVideos = letterVideos.filter(video => /^Letter [A-Z]$/.test(video.theme));
  console.log(`\n📈 Found ${allSimpleLetterVideos.length} simple Letter [A-Z] videos total`);
  
  const uniqueLetters = [...new Set(allSimpleLetterVideos.map(v => v.theme))].sort();
  console.log(`📝 Letters found: ${uniqueLetters.join(', ')}`);
  
  const missingLetters = [];
  for (let i = 65; i <= 90; i++) { // A-Z
    const letter = String.fromCharCode(i);
    if (!uniqueLetters.includes(`Letter ${letter}`)) {
      missingLetters.push(letter);
    }
  }
  
  if (missingLetters.length > 0) {
    console.log(`❌ Missing letters: ${missingLetters.join(', ')}`);
  } else {
    console.log(`✅ All 26 letters (A-Z) have ending videos`);
  }
}

examineTableStructure().catch(console.error);
