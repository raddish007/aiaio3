const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

function getFileExtFromUrlOrType(url, contentType) {
  if (contentType) {
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  }
  const urlExt = url.split('.').pop()?.toLowerCase();
  if (urlExt && ['jpg', 'jpeg', 'png', 'webp'].includes(urlExt)) return urlExt;
  return 'jpg';
}

async function migrateFalImages() {
  console.log('🔎 Searching for FAL images to migrate...');
  const { data: assets, error } = await supabase
    .from('assets')
    .select('*')
    .eq('type', 'image')
    .or('file_url.ilike.%fal.media%,file_url.ilike.%fal.ai%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching assets:', error);
    process.exit(1);
  }
  if (!assets || assets.length === 0) {
    console.log('✅ No FAL images found that need migration!');
    return;
  }
  console.log(`Found ${assets.length} FAL images to migrate.\n`);

  for (const asset of assets) {
    try {
      console.log(`Migrating asset: ${asset.id} (${asset.theme})`);
      console.log(`  FAL URL: ${asset.file_url}`);
      // Download image
      const response = await fetch(asset.file_url);
      if (!response.ok) {
        console.error(`  ❌ Failed to download image: ${response.status} ${response.statusText}`);
        continue;
      }
      const imageBuffer = await response.arrayBuffer();
      const imageData = Buffer.from(imageBuffer);
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const fileExt = getFileExtFromUrlOrType(asset.file_url, contentType);
      const fileName = `fal_migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `assets/images/${fileName}`;
      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, imageData, { contentType, upsert: true });
      if (uploadError) {
        console.error('  ❌ Error uploading to Supabase:', uploadError);
        continue;
      }
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);
      // Merge metadata
      const newMetadata = {
        ...(asset.metadata || {}),
        fal_original_url: asset.file_url,
        file_size_bytes: imageData.length,
        migrated_at: new Date().toISOString(),
      };
      // Update asset
      const { error: updateError } = await supabase
        .from('assets')
        .update({ file_url: publicUrl, metadata: newMetadata })
        .eq('id', asset.id);
      if (updateError) {
        console.error('  ❌ Error updating asset record:', updateError);
        continue;
      }
      console.log(`  ✅ Migrated to: ${publicUrl}`);
    } catch (err) {
      console.error('  ❌ Migration error:', err);
    }
  }
  console.log('\n🎉 Migration complete!');
}

migrateFalImages(); 