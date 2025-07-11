const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixLetterAudioExtensions() {
  try {
    console.log('🔧 Fixing letter audio file extensions from WAV to MP3...\n');
    
    // Query all approved letter audio assets that have WAV extensions
    const { data, error } = await supabase
      .from('assets')
      .select('id, theme, metadata, file_url, created_at, status')
      .eq('type', 'audio')
      .eq('metadata->audio_class', 'letter_audio')
      .eq('status', 'approved')
      .like('file_url', '%.wav')
      .order('metadata->letter', { ascending: true });

    if (error) {
      console.error('Error fetching letter audio assets:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('✅ No letter audio assets with WAV extensions found');
      return;
    }

    console.log(`🔄 Found ${data.length} letter audio assets with WAV extensions to fix\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const asset of data) {
      const letter = asset.metadata?.letter;
      const oldFileUrl = asset.file_url;
      
      if (!letter || !oldFileUrl) {
        console.log(`⚠️  Skipping asset ${asset.id}: missing letter or file_url`);
        continue;
      }

      console.log(`🔄 Fixing ${letter} (${asset.id})...`);
      console.log(`  Old URL: ${oldFileUrl}`);
      
      try {
        // Create new MP3 URL by replacing .wav with .mp3
        const newFileUrl = oldFileUrl.replace('.wav', '.mp3');
        console.log(`  New URL: ${newFileUrl}`);
        
        // Update the asset record with MP3 URL
        const { error: updateError } = await supabase
          .from('assets')
          .update({
            file_url: newFileUrl,
            metadata: {
              ...asset.metadata,
              extension_fixed: true,
              fixed_date: new Date().toISOString(),
              original_wav_url: oldFileUrl // Keep reference to original
            }
          })
          .eq('id', asset.id);
        
        if (updateError) {
          console.log(`  ❌ Failed to update database: ${updateError.message}`);
          errorCount++;
          continue;
        }
        
        console.log(`  ✅ Successfully updated ${letter} to MP3 extension`);
        successCount++;
        
      } catch (error) {
        console.log(`  ❌ Error processing ${letter}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Extension Fix Summary:');
    console.log(`  ✅ Successfully updated: ${successCount}`);
    console.log(`  ❌ Failed updates: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Letter audio file extensions have been fixed!');
      console.log('The NameVideo template should now work with letter audio.');
      console.log('\n⚠️  Note: Make sure the actual files are MP3 format.');
      console.log('If the files are still WAV format, you may need to convert them.');
    }
    
  } catch (error) {
    console.error('Error in extension fix process:', error);
  }
}

fixLetterAudioExtensions(); 