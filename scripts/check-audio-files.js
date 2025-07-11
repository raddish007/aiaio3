const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAudioFiles() {
  try {
    console.log('🔍 Checking audio files in database...\n');

    const { data: audioAssets, error } = await supabase
      .from('assets')
      .select('id, file_url, type, status, metadata, created_at')
      .eq('type', 'audio')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    if (!audioAssets || audioAssets.length === 0) {
      console.log('📭 No approved audio files found');
      return;
    }

    console.log(`📊 Found ${audioAssets.length} approved audio files:\n`);

    audioAssets.forEach((asset, index) => {
      console.log(`${index + 1}. Audio Asset:`);
      console.log(`   ID: ${asset.id}`);
      console.log(`   URL: ${asset.file_url}`);
      console.log(`   Status: ${asset.status}`);
      console.log(`   Created: ${asset.created_at}`);
      if (asset.metadata) {
        console.log(`   Metadata:`, JSON.stringify(asset.metadata, null, 2));
      }
      console.log('');
    });

    // Check for background music specifically
    console.log('🎵 Looking for background music assets...\n');
    
    const { data: backgroundMusic, error: bgError } = await supabase
      .from('assets')
      .select('id, file_url, metadata')
      .eq('type', 'audio')
      .eq('status', 'approved')
      .eq('metadata->>audio_class', 'background_music')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!bgError && backgroundMusic && backgroundMusic.length > 0) {
      console.log(`🎵 Found ${backgroundMusic.length} background music files:`);
      backgroundMusic.forEach((bg, index) => {
        console.log(`   ${index + 1}. ${bg.file_url}`);
      });
    } else {
      console.log('🎵 No background music files found');
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkAudioFiles(); 