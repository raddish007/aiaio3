require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndFixAssets() {
  console.log('🔍 Checking Happy Dance Audio and Ending Video assets...');
  
  // Check Happy Dance Audio
  const { data: happyDanceAudio, error: hdError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', '022aaf1e-6ae7-4240-aec4-2a84d0be7b03')
    .single();

  if (hdError) {
    console.error('❌ Error fetching happy dance audio:', hdError);
  } else {
    console.log('\n🎵 Happy Dance Audio Asset:');
    console.log(`  ID: ${happyDanceAudio.id}`);
    console.log(`  Type: ${happyDanceAudio.type}`);
    console.log(`  Status: ${happyDanceAudio.status}`);
    console.log(`  Metadata:`, JSON.stringify(happyDanceAudio.metadata, null, 2));
  }

  // Check Ending Video  
  const { data: endingVideo, error: evError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', '1010c99b-8e10-4e34-bfe9-2e3f697b457f')
    .single();

  if (evError) {
    console.error('❌ Error fetching ending video:', evError);
  } else {
    console.log('\n🎬 Ending Video Asset:');
    console.log(`  ID: ${endingVideo.id}`);
    console.log(`  Type: ${endingVideo.type}`);
    console.log(`  Status: ${endingVideo.status}`);
    console.log(`  Metadata:`, JSON.stringify(endingVideo.metadata, null, 2));
  }

  // Fix Happy Dance Audio - should be general (no targetLetter)
  if (happyDanceAudio) {
    console.log('\n🔧 Fixing Happy Dance Audio metadata...');
    
    const updatedMetadata = {
      ...happyDanceAudio.metadata,
      template: 'letter-hunt',
      assetPurpose: 'happyDanceAudio',
      targetLetter: null, // Make it general
      child_name: null,   // Make it general
    };

    const { error: updateError } = await supabase
      .from('assets')
      .update({ metadata: updatedMetadata })
      .eq('id', happyDanceAudio.id);

    if (updateError) {
      console.error('❌ Error updating happy dance audio:', updateError);
    } else {
      console.log('✅ Happy Dance Audio metadata updated successfully');
    }
  }

  // Fix Ending Video - should be letter-specific 
  if (endingVideo) {
    console.log('\n🔧 Fixing Ending Video metadata...');
    
    const updatedMetadata = {
      ...endingVideo.metadata,
      template: 'letter-hunt',
      videoType: 'endingVideo',
      targetLetter: 'A', // Letter-specific
      child_name: null,   // Not child-specific
      theme: null,        // Not theme-specific
    };

    const { error: updateError } = await supabase
      .from('assets')
      .update({ metadata: updatedMetadata })
      .eq('id', endingVideo.id);

    if (updateError) {
      console.error('❌ Error updating ending video:', updateError);
    } else {
      console.log('✅ Ending Video metadata updated successfully');
    }
  }
}

checkAndFixAssets().catch(console.error);
