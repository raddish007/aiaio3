const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config({ path: '../.env.local' });

const execAsync = promisify(exec);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Download file from URL
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file async
      reject(err);
    });
  });
}

// Convert WAV to MP3 using ffmpeg
async function convertWavToMp3(inputPath, outputPath) {
  try {
    const command = `ffmpeg -i "${inputPath}" -acodec libmp3lame -ab 128k "${outputPath}" -y`;
    await execAsync(command);
    return true;
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error);
    return false;
  }
}

async function convertWavLetterAudioToMp3() {
  try {
    console.log('🔄 Starting WAV to MP3 conversion for letter audio files...\n');
    
    // Create temp directory
    const tempDir = path.join(__dirname, 'temp_audio_conversion');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Query all approved letter audio assets that are WAV files
    const { data, error } = await supabase
      .from('assets')
      .select('id, theme, metadata, file_url, created_at, status')
      .eq('type', 'audio')
      .eq('metadata->audio_class', 'letter_audio')
      .eq('status', 'approved')
      .order('metadata->letter', { ascending: true });

    if (error) {
      console.error('Error fetching letter audio assets:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ No approved letter audio assets found');
      return;
    }

    console.log(`✅ Found ${data.length} approved letter audio assets to convert\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const asset of data) {
      const letter = asset.metadata?.letter;
      const fileUrl = asset.file_url;
      
      if (!letter || !fileUrl) {
        console.log(`⚠️  Skipping asset ${asset.id}: missing letter or file_url`);
        continue;
      }

      // Check if it's already an MP3 file
      if (fileUrl.toLowerCase().includes('.mp3')) {
        console.log(`✅ ${letter}: Already MP3 format, skipping`);
        continue;
      }

      console.log(`🔄 Converting ${letter} (${asset.id})...`);
      
      try {
        // Download WAV file
        const wavPath = path.join(tempDir, `${asset.id}.wav`);
        const mp3Path = path.join(tempDir, `${asset.id}.mp3`);
        
        console.log(`  📥 Downloading from: ${fileUrl}`);
        await downloadFile(fileUrl, wavPath);
        
        // Convert to MP3
        console.log(`  🔄 Converting WAV to MP3...`);
        const conversionSuccess = await convertWavToMp3(wavPath, mp3Path);
        
        if (!conversionSuccess) {
          console.log(`  ❌ Failed to convert ${letter}`);
          errorCount++;
          continue;
        }
        
        // Upload MP3 file to Supabase
        console.log(`  📤 Uploading MP3 to Supabase...`);
        const mp3Buffer = fs.readFileSync(mp3Path);
        const mp3FileName = `letter_audio_${letter}_${Date.now()}.mp3`;
        const mp3FilePath = `assets/audio/${mp3FileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(mp3FilePath, mp3Buffer, { 
            contentType: 'audio/mpeg',
            upsert: true 
          });
        
        if (uploadError) {
          console.log(`  ❌ Failed to upload MP3: ${uploadError.message}`);
          errorCount++;
          continue;
        }
        
        // Get public URL for MP3
        const { data: { publicUrl: mp3Url } } = supabase.storage
          .from('assets')
          .getPublicUrl(mp3FilePath);
        
        // Update the asset record with MP3 URL
        const { error: updateError } = await supabase
          .from('assets')
          .update({
            file_url: mp3Url,
            metadata: {
              ...asset.metadata,
              original_wav_url: fileUrl, // Keep reference to original
              converted_to_mp3: true,
              conversion_date: new Date().toISOString()
            }
          })
          .eq('id', asset.id);
        
        if (updateError) {
          console.log(`  ❌ Failed to update database: ${updateError.message}`);
          errorCount++;
          continue;
        }
        
        console.log(`  ✅ Successfully converted ${letter} to MP3`);
        successCount++;
        
        // Clean up temp files
        fs.unlinkSync(wavPath);
        fs.unlinkSync(mp3Path);
        
      } catch (error) {
        console.log(`  ❌ Error processing ${letter}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    console.log('\n📊 Conversion Summary:');
    console.log(`  ✅ Successfully converted: ${successCount}`);
    console.log(`  ❌ Failed conversions: ${errorCount}`);
    console.log(`  📁 Temp directory cleaned up`);
    
    if (successCount > 0) {
      console.log('\n🎉 Letter audio files have been converted to MP3 format!');
      console.log('The NameVideo template should now work with letter audio.');
    }
    
  } catch (error) {
    console.error('Error in conversion process:', error);
  }
}

// Check if ffmpeg is available
async function checkFfmpeg() {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking ffmpeg availability...');
  const ffmpegAvailable = await checkFfmpeg();
  
  if (!ffmpegAvailable) {
    console.error('❌ ffmpeg is not installed or not in PATH');
    console.log('Please install ffmpeg to convert audio files:');
    console.log('  macOS: brew install ffmpeg');
    console.log('  Ubuntu: sudo apt install ffmpeg');
    console.log('  Windows: Download from https://ffmpeg.org/download.html');
    return;
  }
  
  console.log('✅ ffmpeg is available\n');
  await convertWavLetterAudioToMp3();
}

main(); 