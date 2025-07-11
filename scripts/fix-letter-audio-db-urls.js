const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixLetterAudioDbUrls() {
  try {
    console.log('🔧 Fixing letter audio file_url fields from .wav to .mp3 in the database...\n');
    
    // Query all approved letter audio assets that have .wav in file_url
    const { data, error } = await supabase
      .from('assets')
      .select('id, file_url, metadata')
      .eq('type', 'audio')
      .eq('metadata->>audio_class', 'letter_audio')
      .like('file_url', '%.wav');

    if (error) {
      console.error('Error fetching letter audio assets:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('✅ No letter audio assets with .wav URLs found');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const asset of data) {
      const oldUrl = asset.file_url;
      const newUrl = oldUrl.replace('.wav', '.mp3');
      if (oldUrl === newUrl) continue;
      console.log(`🔄 Updating asset ${asset.id}:`);
      console.log(`    Old URL: ${oldUrl}`);
      console.log(`    New URL: ${newUrl}`);
      const { error: updateError } = await supabase
        .from('assets')
        .update({
          file_url: newUrl,
          metadata: {
            ...asset.metadata,
            extension_fixed: true,
            fixed_date: new Date().toISOString(),
            original_wav_url: oldUrl
          }
        })
        .eq('id', asset.id);
      if (updateError) {
        console.log(`  ❌ Failed to update: ${updateError.message}`);
        errorCount++;
      } else {
        console.log('  ✅ Updated successfully');
        successCount++;
      }
    }

    console.log(`\n📊 Summary: ${successCount} updated, ${errorCount} failed.`);
    if (successCount > 0) {
      console.log('🎉 All .wav URLs have been updated to .mp3!');
    }
  } catch (error) {
    console.error('Error in fixLetterAudioDbUrls:', error);
  }
}

fixLetterAudioDbUrls(); 