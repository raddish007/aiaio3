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

async function checkDreamDripAsset() {
  console.log('🎵 Checking Dream Drip asset...\n');

  try {
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
      console.log('❌ Asset not found');
      return;
    }

    console.log('✅ Dream Drip Asset Details:');
    console.log(`   ID: ${asset.id}`);
    console.log(`   Type: ${asset.type}`);
    console.log(`   Theme: ${asset.theme}`);
    console.log(`   Status: ${asset.status}`);
    console.log(`   File URL: ${asset.file_url}`);
    console.log(`   Tags: ${asset.tags?.join(', ') || 'None'}`);
    console.log(`   Created: ${new Date(asset.created_at).toLocaleString()}`);
    console.log(`   Metadata: ${JSON.stringify(asset.metadata, null, 2)}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDreamDripAsset(); 