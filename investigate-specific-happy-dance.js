const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateHappyDanceAsset() {
  console.log('🐕 Happy Dance Asset Investigation');
  console.log('=================================');
  
  const assetId = '0dddacc9-b2e1-4d87-9c36-7ffbe121f4fa';
  
  console.log('\n1. Fetching the specific Happy Dance asset:');
  const { data: asset, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single();
    
  if (asset) {
    console.log('   ✅ Asset found!');
    console.log('   Asset details:');
    console.log('   - ID:', asset.id);
    console.log('   - File URL:', asset.file_url);
    console.log('   - Media Type:', asset.mediaType);
    console.log('   - Asset Purpose:', asset.assetPurpose);
    console.log('   - Video Type:', asset.videoType);
    console.log('   - Theme:', asset.theme);
    console.log('   - Target Letter:', asset.targetLetter);
    console.log('   - Child Name:', asset.childName);
    console.log('   - Image Type:', asset.imageType);
    console.log('   - Description:', asset.description);
    console.log('   - Created:', asset.created_at);
    console.log('\n   Full asset object:');
    console.log(JSON.stringify(asset, null, 2));
  } else {
    console.log('   ❌ Asset not found!', error);
    return;
  }
  
  console.log('\n2. What the Remotion composition expects:');
  console.log('   For Happy Dance VIDEO:');
  console.log('   - mediaType: "video"');
  console.log('   - assetPurpose: "happyDanceVideo" OR videoType: "happyDance"');
  console.log('   - theme: matches childTheme');
  console.log('');
  console.log('   For Happy Dance AUDIO:');
  console.log('   - mediaType: "audio"');
  console.log('   - assetPurpose: "happyDanceAudio"');
  console.log('   - targetLetter: matches the letter');
  
  console.log('\n3. Checking what this asset matches:');
  const isVideo = asset.mediaType === 'video';
  const isAudio = asset.mediaType === 'audio';
  const hasHappyDanceVideoPurpose = asset.assetPurpose === 'happyDanceVideo';
  const hasHappyDanceVideoType = asset.videoType === 'happyDance';
  const hasHappyDanceAudioPurpose = asset.assetPurpose === 'happyDanceAudio';
  
  console.log('   Asset type analysis:');
  console.log('   - Is Video:', isVideo);
  console.log('   - Is Audio:', isAudio);
  console.log('   - Has happyDanceVideo purpose:', hasHappyDanceVideoPurpose);
  console.log('   - Has happyDance videoType:', hasHappyDanceVideoType);
  console.log('   - Has happyDanceAudio purpose:', hasHappyDanceAudioPurpose);
  
  if (isVideo && (hasHappyDanceVideoPurpose || hasHappyDanceVideoType)) {
    console.log('   ✅ This should work as Happy Dance VIDEO');
  } else if (isAudio && hasHappyDanceAudioPurpose) {
    console.log('   ✅ This should work as Happy Dance AUDIO');
  } else {
    console.log('   ❌ This asset does not match Happy Dance criteria');
    console.log('   💡 Need to update metadata to make it work');
  }
  
  console.log('\n4. Checking if the UI query would find this asset:');
  // Simulating the UI query
  if (isVideo) {
    const { data: videoQuery, error: vError } = await supabase
      .from('assets')
      .select('*')
      .eq('mediaType', 'video')
      .or(`assetPurpose.eq.happyDanceVideo,videoType.eq.happyDance`)
      .eq('theme', asset.theme || 'halloween');
      
    console.log(`   Video query results: ${videoQuery?.length || 0} assets`);
    const foundThisAsset = videoQuery?.find(a => a.id === assetId);
    console.log('   This asset found in video query:', !!foundThisAsset);
  }
  
  if (isAudio) {
    const { data: audioQuery, error: aError } = await supabase
      .from('assets')
      .select('*')
      .eq('mediaType', 'audio')
      .eq('assetPurpose', 'happyDanceAudio');
      
    console.log(`   Audio query results: ${audioQuery?.length || 0} assets`);
    const foundThisAsset = audioQuery?.find(a => a.id === assetId);
    console.log('   This asset found in audio query:', !!foundThisAsset);
  }
}

investigateHappyDanceAsset().catch(console.error);
