const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function tagAllEndingVideos() {
  console.log('🔧 Tagging all Letter A-Z videos as ending videos...');
  
  // Find all simple Letter [A-Z] videos
  const { data: letterVideos, error: letterError } = await supabase
    .from('assets')
    .select('*')
    .like('theme', 'Letter %')
    .eq('type', 'video');

  if (letterError) {
    console.error('❌ Error fetching letter videos:', letterError);
    return;
  }

  // Filter for simple Letter [A-Z] themes only (not compound themes like "Letter A Alligator")
  const simpleLetterVideos = letterVideos.filter(video => /^Letter [A-Z]$/.test(video.theme));

  console.log(`\n📊 Found ${simpleLetterVideos.length} simple Letter [A-Z] videos:`);
  simpleLetterVideos.forEach(video => {
    console.log(`- ${video.theme}: ${video.id} - ${video.title}`);
    console.log(`  Current tags: [${video.tags.join(', ')}]`);
    console.log(`  Current videoType: ${video.metadata?.videoType || 'none'}`);
  });

  console.log('\n⚡ Updating videos with ending tags and metadata...');

  const updatePromises = simpleLetterVideos.map(async (video) => {
    // Add "ending" to tags if not already present
    const newTags = video.tags.includes('ending') ? video.tags : [...video.tags, 'ending'];
    
    // Update metadata to include videoType: "endingVideo"
    const newMetadata = {
      ...video.metadata,
      videoType: 'endingVideo'
    };

    const { data, error } = await supabase
      .from('assets')
      .update({ 
        tags: newTags,
        metadata: newMetadata
      })
      .eq('id', video.id)
      .select();

    if (error) {
      console.error(`❌ Error updating ${video.theme} (${video.id}):`, error);
      return { success: false, id: video.id, theme: video.theme, error };
    } else {
      console.log(`✅ Updated ${video.theme} (${video.id})`);
      console.log(`  - Added "ending" tag`);
      console.log(`  - Set metadata.videoType = "endingVideo"`);
      return { success: true, id: video.id, theme: video.theme, data };
    }
  });

  const results = await Promise.all(updatePromises);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n📈 Update Summary:`);
  console.log(`✅ Successfully updated: ${successful.length} videos`);
  console.log(`❌ Failed to update: ${failed.length} videos`);

  if (failed.length > 0) {
    console.log('\n❌ Failed updates:');
    failed.forEach(f => console.log(`- ${f.theme} (${f.id}): ${f.error?.message}`));
  }

  console.log('\n🔍 Verifying updates...');
  
  // Verify by checking for videos with "ending" tag
  const { data: endingTaggedVideos, error: verifyError } = await supabase
    .from('assets')
    .select('id, theme, tags, metadata')
    .contains('tags', ['ending'])
    .like('theme', 'Letter %');

  if (verifyError) {
    console.error('❌ Error verifying updates:', verifyError);
    return;
  }

  console.log(`\n✅ Verification: Found ${endingTaggedVideos.length} videos with "ending" tag:`);
  endingTaggedVideos.forEach(video => {
    console.log(`- ${video.theme}: ${video.id}`);
    console.log(`  - videoType: ${video.metadata?.videoType}`);
    console.log(`  - tags: [${video.tags.join(', ')}]`);
  });

  // Check completeness - should have 26 letters A-Z
  const taggedThemes = endingTaggedVideos.map(v => v.theme);
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const missingLetters = allLetters.filter(letter => !taggedThemes.includes(`Letter ${letter}`));

  if (missingLetters.length === 0) {
    console.log('\n🎉 SUCCESS: All 26 letters (A-Z) now have ending video tags!');
  } else {
    console.log(`\n⚠️  Still missing ending videos for: ${missingLetters.join(', ')}`);
  }
}

tagAllEndingVideos().catch(console.error);
