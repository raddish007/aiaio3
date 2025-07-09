const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAudioDuration() {
  console.log('🎵 Checking Dream Drip audio duration...\n');

  try {
    // Get the asset details
    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', '2095fd08-1cb1-4373-bafa-f6115dd7dad2')
      .single();

    if (error || !asset) {
      console.error('❌ Error fetching asset:', error);
      return;
    }

    console.log('✅ Asset found:');
    console.log(`   File URL: ${asset.file_url}`);
    console.log(`   Type: ${asset.type}`);
    console.log(`   Theme: ${asset.theme}`);

    // Check if duration is already stored in metadata
    if (asset.metadata?.duration) {
      console.log(`\n📊 Duration from metadata: ${asset.metadata.duration} seconds`);
      return;
    }

    // For now, let's check if we can get basic file info
    console.log('\n📊 Checking file info...');
    
    // Try to get file size and basic info
    const url = new URL(asset.file_url);
    const filename = url.pathname.split('/').pop();
    console.log(`   Filename: ${filename}`);
    
    // Check if it's a WAV file (from the URL we saw earlier)
    if (filename && filename.includes('.wav')) {
      console.log('   Format: WAV');
      console.log('   Note: WAV files typically contain duration info in headers');
    }

    console.log('\n💡 Recommendation:');
    console.log('   The audio duration should be extracted during the moderation flow');
    console.log('   and stored in the asset metadata. This would help with:');
    console.log('   - Setting correct video durations');
    console.log('   - Billing calculations');
    console.log('   - Content planning');
    console.log('   - Template validation');

    console.log('\n🔧 Implementation suggestion:');
    console.log('   - Add duration extraction to the audio generation process');
    console.log('   - Store duration in asset.metadata.duration');
    console.log('   - Use this for template video duration calculations');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAudioDuration(); 