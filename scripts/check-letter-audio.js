const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLetterAudio() {
  try {
    console.log('🔍 Checking letter audio assets...\n');
    
    // Query all approved letter audio assets
    const { data, error } = await supabase
      .from('assets')
      .select('id, theme, metadata, created_at, status')
      .eq('type', 'audio')
      .eq('metadata->audio_class', 'letter_audio')
      .order('metadata->letter', { ascending: true });

    if (error) {
      console.error('Error fetching letter audio assets:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ No letter audio assets found');
      return;
    }

    console.log(`✅ Found ${data.length} letter audio assets:\n`);

    // Group by letter and show details
    const letterMap = new Map();
    const allLetters = new Set();

    data.forEach(asset => {
      const letter = asset.metadata?.letter;
      const status = asset.status;
      
      if (letter) {
        allLetters.add(letter);
        if (!letterMap.has(letter)) {
          letterMap.set(letter, []);
        }
        letterMap.get(letter).push({
          id: asset.id,
          theme: asset.theme,
          status: status,
          created_at: asset.created_at
        });
      }
    });

    // Show all letters found
    console.log('📋 Letters found:');
    const sortedLetters = Array.from(allLetters).sort();
    sortedLetters.forEach(letter => {
      const assets = letterMap.get(letter);
      const approvedCount = assets.filter(a => a.status === 'approved').length;
      const pendingCount = assets.filter(a => a.status === 'pending').length;
      const rejectedCount = assets.filter(a => a.status === 'rejected').length;
      
      console.log(`  ${letter}: ${approvedCount} approved, ${pendingCount} pending, ${rejectedCount} rejected`);
      
      // Show details for each asset
      assets.forEach(asset => {
        const statusIcon = asset.status === 'approved' ? '✅' : asset.status === 'pending' ? '⏳' : '❌';
        console.log(`    ${statusIcon} ${asset.id} - "${asset.theme}" (${new Date(asset.created_at).toLocaleDateString()})`);
      });
    });

    // Show missing letters (A-Z)
    console.log('\n🔍 Missing letters (A-Z):');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const missingLetters = alphabet.filter(letter => !allLetters.has(letter));
    
    if (missingLetters.length === 0) {
      console.log('  ✅ All letters A-Z are available!');
    } else {
      missingLetters.forEach(letter => {
        console.log(`  ❌ ${letter}`);
      });
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`  Total letter audio assets: ${data.length}`);
    console.log(`  Unique letters available: ${allLetters.size}/26`);
    console.log(`  Approved assets: ${data.filter(a => a.status === 'approved').length}`);
    console.log(`  Pending assets: ${data.filter(a => a.status === 'pending').length}`);
    console.log(`  Rejected assets: ${data.filter(a => a.status === 'rejected').length}`);

    // Check for assets without letter field
    const assetsWithoutLetter = data.filter(asset => !asset.metadata?.letter);
    if (assetsWithoutLetter.length > 0) {
      console.log('\n⚠️  Assets missing letter field:');
      assetsWithoutLetter.forEach(asset => {
        console.log(`  ${asset.id} - "${asset.theme}" (${asset.status})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkLetterAudio(); 