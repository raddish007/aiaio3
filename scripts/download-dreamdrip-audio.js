const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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

async function downloadDreamDripAudio() {
  console.log('🎵 Downloading DreamDrip audio for local preview...\n');

  try {
    // Get the DreamDrip asset
    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', '2095fd08-1cb1-4373-bafa-f6115dd7dad2')
      .single();

    if (error) {
      console.error('❌ Error fetching asset:', error);
      return;
    }

    if (!asset) {
      console.log('❌ DreamDrip asset not found');
      return;
    }

    console.log('✅ DreamDrip Asset Details:');
    console.log(`   ID: ${asset.id}`);
    console.log(`   Type: ${asset.type}`);
    console.log(`   Theme: ${asset.theme}`);
    console.log(`   File URL: ${asset.file_url}`);

    if (!asset.file_url) {
      console.error('❌ No file URL available');
      return;
    }

    // Download the file
    const outputPath = path.join(__dirname, '..', 'remotion', 'public', 'assets', 'audio', 'DreamDrip.mp3');
    
    console.log(`\n📥 Downloading to: ${outputPath}`);

    const url = new URL(asset.file_url);
    const protocol = url.protocol === 'https:' ? https : http;

    const file = fs.createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
      protocol.get(asset.file_url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log('✅ DreamDrip audio downloaded successfully!');
          console.log(`   File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(outputPath, () => {}); // Delete the file if there was an error
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

downloadDreamDripAudio(); 