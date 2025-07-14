const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndrewLetterAudios() {
  console.log('🔤 Checking Andrew letter audio assets...');
  
  // Check all Andrew audio assets
  const { data: allAudio, error } = await supabase
    .from('assets')
    .select('id, file_url, metadata, status')
    .eq('metadata->>child_name', 'Andrew')
    .eq('type', 'audio')
    .in('status', ['approved', 'pending']);
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📋 All Andrew audio assets:');
  allAudio.forEach((asset, index) => {
    const audioClass = asset.metadata?.audio_class;
    const assetClass = asset.metadata?.asset_class;
    const template = asset.metadata?.template;
    console.log('');
    console.log(`Asset ${index + 1}: ${asset.id.slice(-8)}`);
    console.log(`  - Audio Class: ${audioClass}`);
    console.log(`  - Asset Class: ${assetClass}`);
    console.log(`  - Template: ${template}`);
    console.log(`  - Status: ${asset.status}`);
    console.log(`  - Letter: ${asset.metadata?.letter || 'N/A'}`);
  });
  
  // Check specifically for letter audio
  console.log('\n🎯 Looking for letter audio assets...');
  const letterAudios = allAudio.filter(asset => {
    const audioClass = asset.metadata?.audio_class || asset.metadata?.asset_class;
    return audioClass === 'letter_audio';
  });
  
  console.log(`✅ Found ${letterAudios.length} letter audio assets for Andrew`);
  letterAudios.forEach(asset => {
    console.log(`  - Letter: ${asset.metadata?.letter} | ID: ${asset.id.slice(-8)}`);
  });
  
  // Check what letters Andrew needs
  const andrewLetters = 'ANDREW'.split('');
  console.log(`\n📝 Andrew needs letters: ${andrewLetters.join(', ')}`);
  
  const missingLetters = andrewLetters.filter(letter => {
    return !letterAudios.some(asset => asset.metadata?.letter === letter);
  });
  
  if (missingLetters.length > 0) {
    console.log(`❌ Missing letter audios: ${missingLetters.join(', ')}`);
  } else {
    console.log('✅ All letter audios are available!');
  }
}

checkAndrewLetterAudios().catch(console.error);
