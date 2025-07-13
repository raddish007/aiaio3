const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://etshvxrgbssginmzsczo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI'
);

async function fixEndingVideosPurpose() {
  console.log('🔧 Fixing Letter ending videos by setting purpose="ending"...');
  
  // Find all videos with exact "Letter [LETTER]" theme pattern (single letter only) that are videos
  const { data: letterVideos, error: letterError } = await supabase
    .from('assets')
    .select('*')
    .like('theme', 'Letter %')
    .eq('type', 'video');

  if (letterError) {
    console.error('❌ Error fetching letter videos:', letterError);
    return;
  }

  console.log(`\n📊 Found ${letterVideos.length} Letter themed videos`);

  // Filter for videos that have "endingVideo" in their metadata.videoType
  const endingVideos = letterVideos.filter(video => {
    // Check if theme is exactly "Letter [SINGLE_LETTER]" (not compound like "Letter A Alligator")
    const isSimpleLetterTheme = /^Letter [A-Z](\s|$)/.test(video.theme) && 
                               !video.theme.includes(' ') || 
                               video.theme.split(' ').length === 2;
    
    // Check if metadata contains videoType: "endingVideo"
    const hasEndingVideoType = video.metadata && 
                              video.metadata.videoType === 'endingVideo';
    
    return isSimpleLetterTheme && hasEndingVideoType;
  });

  console.log(`\n🎯 Found ${endingVideos.length} videos that should be tagged as ending:`);
  endingVideos.forEach(video => {
    console.log(`- ${video.theme}: ${video.id} - ${video.title}`);
  });

  if (endingVideos.length === 0) {
    console.log('❌ No ending videos found to update');
    return;
  }

  console.log('\n⚡ Updating purpose field for ending videos...');

  // Update each video to set purpose = "ending"
  const updatePromises = endingVideos.map(async (video) => {
    const { data, error } = await supabase
      .from('assets')
      .update({ purpose: 'ending' })
      .eq('id', video.id)
      .select();

    if (error) {
      console.error(`❌ Error updating ${video.id}:`, error);
      return { success: false, id: video.id, error };
    } else {
      console.log(`✅ Updated ${video.theme} (${video.id}) - set purpose="ending"`);
      return { success: true, id: video.id, data };
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
    failed.forEach(f => console.log(`- ${f.id}: ${f.error?.message}`));
  }

  console.log('\n🔍 Verifying updates...');
  
  // Verify the updates by checking for videos with purpose="ending"
  const { data: endingPurposeVideos, error: verifyError } = await supabase
    .from('assets')
    .select('id, theme, purpose, metadata')
    .eq('purpose', 'ending')
    .like('theme', 'Letter %');

  if (verifyError) {
    console.error('❌ Error verifying updates:', verifyError);
    return;
  }

  console.log(`\n✅ Verification: Found ${endingPurposeVideos.length} videos with purpose="ending"`);
  endingPurposeVideos.forEach(video => {
    console.log(`- ${video.theme}: ${video.id} (videoType: ${video.metadata?.videoType})`);
  });
}

fixEndingVideosPurpose().catch(console.error);
