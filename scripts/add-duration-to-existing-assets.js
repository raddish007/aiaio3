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

// Simple duration estimation based on file size (fallback)
function estimateDurationFromSize(fileSizeBytes, format = 'mp3') {
  // Rough estimates based on common bitrates
  const bitrates = {
    'mp3': 128000, // 128 kbps
    'wav': 1411000, // 1411 kbps (CD quality)
    'm4a': 128000, // 128 kbps
    'ogg': 128000 // 128 kbps
  };
  
  const bitrate = bitrates[format] || bitrates['mp3'];
  const bytesPerSecond = bitrate / 8;
  return fileSizeBytes / bytesPerSecond;
}

// Fetch file size from URL
function getFileSize(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const contentLength = res.headers['content-length'];
      if (contentLength) {
        resolve(parseInt(contentLength));
      } else {
        reject(new Error('No content-length header'));
      }
    }).on('error', reject);
  });
}

async function addDurationToExistingAssets() {
  console.log('🎵 Adding duration metadata to existing audio assets...\n');

  try {
    // Get audio assets without duration metadata
    const { data: audioAssets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'audio')
      .is('metadata->duration', null);

    if (error || !audioAssets) {
      console.error('❌ Error fetching audio assets:', error);
      return;
    }

    console.log(`✅ Found ${audioAssets.length} audio assets without duration metadata\n`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const asset of audioAssets) {
      console.log(`📊 Processing: ${asset.theme}`);
      console.log(`   ID: ${asset.id}`);
      
      if (!asset.file_url) {
        console.log(`   ⚠️  No file URL, skipping`);
        errorCount++;
        continue;
      }

      try {
        // Get file size
        const fileSize = await getFileSize(asset.file_url);
        console.log(`   📁 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

        // Determine format from URL
        const format = asset.file_url.split('.').pop()?.toLowerCase() || 'mp3';
        console.log(`   🎵 Format: ${format}`);

        // Estimate duration
        const estimatedDuration = estimateDurationFromSize(fileSize, format);
        console.log(`   ⏱️  Estimated duration: ${estimatedDuration.toFixed(2)}s`);

        // Update asset metadata
        const { error: updateError } = await supabase
          .from('assets')
          .update({
            metadata: {
              ...asset.metadata,
              duration: estimatedDuration,
              duration_source: 'estimated_from_file_size',
              duration_extracted_at: new Date().toISOString()
            }
          })
          .eq('id', asset.id);

        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Duration added successfully`);
          updatedCount++;
        }

      } catch (assetError) {
        console.log(`   ❌ Error processing asset: ${assetError.message}`);
        errorCount++;
      }

      console.log('');
    }

    console.log('📊 Summary:');
    console.log(`   ✅ Successfully updated: ${updatedCount} assets`);
    console.log(`   ❌ Errors: ${errorCount} assets`);
    console.log(`   📝 Note: Duration was estimated from file size as a fallback`);
    console.log(`   🔧 New audio generation will extract exact duration`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addDurationToExistingAssets(); 