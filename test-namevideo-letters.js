const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNameVideoLetterQuery() {
  console.log('🎯 Testing NameVideo letter audio query (simulating the updated page)...');
  
  try {
    // This simulates the exact query from the updated NameVideo v2 page
    const letterAudioAssets = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('type', 'audio')
      .or(`metadata->>asset_class.eq.letter_audio,metadata->>audio_class.eq.letter_audio`);
      
    if (letterAudioAssets.error) {
      console.error('❌ Query error:', letterAudioAssets.error);
      return;
    }
    
    console.log(`✅ NameVideo query found ${letterAudioAssets.data?.length || 0} letter audio assets`);
    
    // Simulate how NameVideo processes the letters for "Andrew"
    const nameToUse = 'Andrew';
    const letters = nameToUse.toUpperCase().split('');
    console.log(`📝 Processing letters for "${nameToUse}": ${letters.join(', ')}`);
    
    // Initialize letter audios like the NameVideo page does
    const letterAudios = {};
    letters.forEach(letter => {
      letterAudios[letter] = {
        type: 'audio',
        name: `Letter ${letter} Audio`,
        description: `Pronunciation of letter "${letter}"`,
        status: 'missing',
        url: ''
      };
    });
    
    // Process letter audio assets like the NameVideo page does
    if (letterAudioAssets.data) {
      letterAudioAssets.data.forEach(asset => {
        const letter = asset.metadata?.letter?.toUpperCase();
        if (letter && letterAudios[letter]) {
          letterAudios[letter] = {
            ...letterAudios[letter],
            status: asset.status === 'approved' ? 'ready' : 'generating',
            url: asset.file_url || '',
            generatedAt: asset.created_at
          };
        }
      });
    }
    
    // Show results
    console.log('\n📋 Letter audio status for Andrew:');
    Object.entries(letterAudios).forEach(([letter, audio]) => {
      console.log(`  - ${letter}: ${audio.status.toUpperCase()}`);
    });
    
    const readyCount = Object.values(letterAudios).filter(audio => audio.status === 'ready').length;
    console.log(`\n🎉 ${readyCount}/${letters.length} letter audios are ready!`);
    
  } catch (err) {
    console.error('❌ Caught error:', err.message);
  }
}

testNameVideoLetterQuery().catch(console.error);
