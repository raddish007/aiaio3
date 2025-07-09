const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function testDurationExtraction() {
  console.log('🎵 Testing audio duration extraction...\n');

  try {
    // Get a few audio assets to test
    const { data: audioAssets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'audio')
      .limit(5);

    if (error || !audioAssets) {
      console.error('❌ Error fetching audio assets:', error);
      return;
    }

    console.log(`✅ Found ${audioAssets.length} audio assets to test\n`);

    for (const asset of audioAssets) {
      console.log(`📊 Asset: ${asset.theme}`);
      console.log(`   ID: ${asset.id}`);
      console.log(`   File URL: ${asset.file_url}`);
      
      // Check if duration is already stored
      if (asset.metadata?.duration) {
        console.log(`   ✅ Duration from metadata: ${asset.metadata.duration.toFixed(2)}s`);
      } else {
        console.log(`   ❌ No duration in metadata`);
      }

      // Check generation method
      if (asset.metadata?.generation_method) {
        console.log(`   🔧 Generation method: ${asset.metadata.generation_method}`);
      }

      console.log('');
    }

    console.log('💡 Summary:');
    console.log('   - Duration extraction has been added to:');
    console.log('     * ElevenLabs audio generation (/api/assets/generate-audio.ts)');
    console.log('     * FAL AI audio generation (/api/assets/generate-fal.ts)');
    console.log('     * Audio trimming (/api/assets/trim-audio.ts)');
    console.log('   - Duration is stored in asset.metadata.duration');
    console.log('   - Duration is displayed in admin UI for audio/video assets');
    console.log('   - Duration helps with video template planning and billing');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDurationExtraction(); 