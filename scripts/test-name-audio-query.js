const { createClient } = require('@supabase/supabase-js');

// Direct environment variables
const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testNameAudioQuery() {
  console.log('🔍 Testing name audio query for Nolan...\n');

  const childName = 'Nolan';
  
  try {
    // Test the exact query from the API
    console.log(`🔍 DEBUGGING: Looking for name audio for child: "${childName}"`);
    
    const { data: nameAudioAssets, error: nameAudioError } = await supabase
      .from('assets')
      .select('file_url, metadata')
      .eq('type', 'audio')
      .eq('status', 'approved')
      .eq('metadata->>audio_class', 'name_audio')
      .eq('metadata->>child_name', childName)
      .order('created_at', { ascending: false })
      .limit(1);

    console.log(`🔍 DEBUGGING: Query completed`);
    console.log(`🔍 DEBUGGING: Error:`, nameAudioError);
    console.log(`🔍 DEBUGGING: Data:`, nameAudioAssets);
    console.log(`🔍 DEBUGGING: Found ${nameAudioAssets?.length || 0} results`);

    if (!nameAudioError && nameAudioAssets && nameAudioAssets.length > 0) {
      const nameAudioUrl = nameAudioAssets[0].file_url;
      console.log(`✅ DEBUGGING: Using name audio for ${childName}: ${nameAudioUrl}`);
    } else {
      console.error(`❌ DEBUGGING: No name audio found for child: ${childName}`);
      console.error(`❌ DEBUGGING: Error details:`, nameAudioError);
      
      // Try a broader search for debugging
      const { data: debugAssets } = await supabase
        .from('assets')
        .select('metadata->child_name, metadata->audio_class, status')
        .eq('type', 'audio')
        .eq('metadata->>child_name', childName);
      console.log(`🔍 DEBUGGING: All audio for ${childName}:`, debugAssets);
      
      // Try case-insensitive search
      console.log('\n🔍 Trying case-insensitive search...');
      const { data: caseInsensitiveAssets } = await supabase
        .from('assets')
        .select('metadata->child_name, metadata->audio_class, status')
        .eq('type', 'audio')
        .ilike('metadata->>child_name', childName);
      console.log(`🔍 Case-insensitive results:`, caseInsensitiveAssets);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testNameAudioQuery(); 