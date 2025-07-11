const { createClient } = require('@supabase/supabase-js');

// Direct environment variables
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkNolanAudio() {
  console.log('🔍 Checking for Nolan name audio...\n');

  try {
    // Check for name audio for Nolan
    const { data: nameAudio, error: nameAudioError } = await supabase
      .from('assets')
      .select('id, file_url, metadata, theme, status')
      .eq('type', 'audio')
      .eq('status', 'approved')
      .eq('metadata->>audio_class', 'name_audio')
      .eq('metadata->>child_name', 'Nolan');

    if (nameAudioError) {
      console.error('❌ Error fetching name audio:', nameAudioError);
      return;
    }

    console.log(`📊 Found ${nameAudio?.length || 0} name audio files for Nolan:`);
    
    if (nameAudio && nameAudio.length > 0) {
      nameAudio.forEach((audio, index) => {
        console.log(`${index + 1}. ID: ${audio.id}`);
        console.log(`   URL: ${audio.file_url}`);
        console.log(`   Theme: ${audio.theme}`);
        console.log(`   Metadata:`, audio.metadata);
        console.log('');
      });
    } else {
      console.log('❌ No name audio found for Nolan');
      
      // Check for any name audio files
      const { data: allNameAudio, error: allNameAudioError } = await supabase
        .from('assets')
        .select('metadata->>child_name, metadata->>audio_class, status')
        .eq('type', 'audio')
        .eq('status', 'approved')
        .eq('metadata->>audio_class', 'name_audio');

      if (!allNameAudioError && allNameAudio && allNameAudio.length > 0) {
        console.log('📋 Available name audio files:');
        allNameAudio.forEach(audio => {
          console.log(`   - ${audio['metadata->>child_name']}`);
        });
      }
    }

    // Check for letter audio for Nolan's letters
    const letters = ['N', 'O', 'L', 'A', 'N'];
    console.log('\n🔤 Checking letter audio for Nolan\'s letters...');
    
    for (const letter of letters) {
      const { data: letterAudio, error: letterAudioError } = await supabase
        .from('assets')
        .select('id, file_url, metadata')
        .eq('type', 'audio')
        .eq('status', 'approved')
        .eq('metadata->>audio_class', 'letter_audio')
        .eq('metadata->>letter', letter);

      if (!letterAudioError && letterAudio && letterAudio.length > 0) {
        console.log(`✅ Letter ${letter}: ${letterAudio[0].file_url}`);
      } else {
        console.log(`❌ Letter ${letter}: Not found`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkNolanAudio(); 