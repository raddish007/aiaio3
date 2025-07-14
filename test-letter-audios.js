const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLetterAudioQuery() {
  console.log('🔤 Testing letter audio query for NameVideo...');
  
  try {
    // Test the updated query that should get generic letter audios
    const { data, error } = await supabase
      .from('assets')
      .select('id, metadata, status')
      .eq('type', 'audio')
      .eq('metadata->>audio_class', 'letter_audio')
      .in('status', ['approved', 'pending']);
      
    if (error) {
      console.error('❌ Query error:', error);
      return;
    }
    
    console.log(`✅ Found ${data.length} letter audio assets`);
    
    // Check which letters we have
    const availableLetters = data
      .map(asset => asset.metadata?.letter)
      .filter(letter => letter)
      .sort();
      
    console.log(`📝 Available letters: ${availableLetters.join(', ')}`);
    
    // Check Andrew's letters specifically
    const andrewLetters = ['A', 'N', 'D', 'R', 'E', 'W'];
    const andrewAvailable = andrewLetters.filter(letter => availableLetters.includes(letter));
    const andrewMissing = andrewLetters.filter(letter => !availableLetters.includes(letter));
    
    console.log(`✅ Andrew has letters: ${andrewAvailable.join(', ')}`);
    if (andrewMissing.length > 0) {
      console.log(`❌ Andrew missing letters: ${andrewMissing.join(', ')}`);
    } else {
      console.log('🎉 Andrew has all needed letters!');
    }
    
    // Show some sample assets
    console.log('\n📋 Sample letter assets:');
    data.slice(0, 6).forEach(asset => {
      console.log(`  - ${asset.metadata?.letter}: ${asset.id.slice(-8)} (${asset.status})`);
    });
    
  } catch (err) {
    console.error('❌ Caught error:', err.message);
  }
}

testLetterAudioQuery().catch(console.error);
