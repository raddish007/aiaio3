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

async function testFalImageStorage() {
  console.log('🖼️  Testing FAL AI image storage fix...\n');

  try {
    // Get recent FAL AI generated images
    const { data: allImages, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'image')
      .order('created_at', { ascending: false })
      .limit(20);

    if (fetchError || !allImages) {
      console.error('❌ Error fetching images:', fetchError);
      return;
    }

    // Filter for FAL AI generated images
    const falImages = allImages.filter(img => 
      img.metadata?.generation_method?.includes('fal.ai')
    );

    if (!falImages || falImages.length === 0) {
      console.log('ℹ️  No FAL AI generated images found');
      return;
    }

    console.log(`✅ Found ${falImages.length} FAL AI generated images\n`);

    let hasTemporaryUrls = false;
    let hasSupabaseUrls = false;

    for (const image of falImages) {
      console.log(`📊 Image: ${image.theme}`);
      console.log(`   ID: ${image.id}`);
      console.log(`   File URL: ${image.file_url}`);
      console.log(`   Generation Method: ${image.metadata?.generation_method || 'unknown'}`);
      
      // Check if using Supabase URL
      if (image.file_url && image.file_url.includes('supabase.co')) {
        console.log(`   ✅ Using Supabase storage URL`);
        hasSupabaseUrls = true;
      } else if (image.file_url && (image.file_url.includes('fal.ai') || image.file_url.includes('fal.media'))) {
        console.log(`   ❌ Still using temporary FAL URL (will expire!)`);
        hasTemporaryUrls = true;
      } else {
        console.log(`   ⚠️  Unknown URL format`);
      }

      // Check for original FAL URL in metadata
      if (image.metadata?.fal_original_url) {
        console.log(`   📝 Original FAL URL stored in metadata: ${image.metadata.fal_original_url.substring(0, 50)}...`);
      }

      // Check file size
      if (image.metadata?.file_size_bytes) {
        console.log(`   📏 File size: ${(image.metadata.file_size_bytes / 1024).toFixed(1)} KB`);
      }

      console.log('');
    }

    console.log('💡 Summary:');
    if (hasSupabaseUrls) {
      console.log('   ✅ Some images are using permanent Supabase URLs');
    }
    if (hasTemporaryUrls) {
      console.log('   ❌ Some images are still using temporary FAL URLs');
      console.log('   🔧 These were generated before the fix and will expire');
    }
    if (!hasTemporaryUrls && hasSupabaseUrls) {
      console.log('   🎉 All recent images are using permanent Supabase URLs!');
    }

    console.log('\n🔧 To test the fix:');
    console.log('   1. Generate a new image using the AI Generator');
    console.log('   2. Check that the file_url points to supabase.co');
    console.log('   3. Verify that fal_original_url is stored in metadata');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testFalImageStorage(); 