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
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTemplateVideoGeneration() {
  console.log('🧪 Testing Template Video Generation...\n');

  try {
    // 1. Check if we have any approved assets
    console.log('📦 Checking for approved assets...');
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .eq('status', 'approved')
      .limit(5);

    if (assetsError) {
      console.error('❌ Error fetching assets:', assetsError);
      return;
    }

    console.log(`✅ Found ${assets.length} approved assets`);
    
    if (assets.length === 0) {
      console.log('⚠️ No approved assets found. Please upload and approve some assets first.');
      return;
    }

    // 2. Create a test template
    console.log('\n🎬 Creating test template...');
    const testTemplate = {
      name: 'Test Lullaby Template',
      description: 'A test template for video generation',
      template_type: 'lullaby',
      global_elements: [
        {
          id: 'global_audio_1',
          type: 'audio',
          asset_purpose: 'background_music',
          description: 'Background music for the entire video',
          required: true,
          asset_type: 'specific',
          specific_asset_id: assets.find(a => a.type === 'audio')?.id,
          specific_asset_name: assets.find(a => a.type === 'audio')?.theme
        }
      ],
      parts: [
        {
          id: 'intro',
          name: 'Intro',
          type: 'intro',
          order: 1,
          duration: 5,
          audio_elements: [],
          image_elements: [
            {
              id: 'intro_image_1',
              asset_purpose: 'intro_background',
              description: 'Intro background image',
              safe_zone: 'intro_safe',
              required: true,
              asset_type: 'specific',
              specific_asset_id: assets.find(a => a.type === 'image')?.id,
              specific_asset_name: assets.find(a => a.type === 'image')?.theme
            }
          ]
        },
        {
          id: 'slideshow',
          name: 'Slideshow',
          type: 'slideshow',
          order: 2,
          duration: 10,
          audio_elements: [],
          image_elements: [
            {
              id: 'slideshow_image_1',
              asset_purpose: 'slideshow_image',
              description: 'Slideshow image',
              safe_zone: 'center_safe',
              required: true,
              asset_type: 'specific',
              specific_asset_id: assets.find(a => a.type === 'image')?.id,
              specific_asset_name: assets.find(a => a.type === 'image')?.theme
            }
          ]
        },
        {
          id: 'outro',
          name: 'Outro',
          type: 'outro',
          order: 3,
          duration: 5,
          audio_elements: [],
          image_elements: [
            {
              id: 'outro_image_1',
              asset_purpose: 'outro_background',
              description: 'Outro background image',
              safe_zone: 'outro_safe',
              required: true,
              asset_type: 'specific',
              specific_asset_id: assets.find(a => a.type === 'image')?.id,
              specific_asset_name: assets.find(a => a.type === 'image')?.theme
            }
          ]
        }
      ]
    };

    const { data: template, error: templateError } = await supabase
      .from('video_templates')
      .insert(testTemplate)
      .select()
      .single();

    if (templateError) {
      console.error('❌ Error creating template:', templateError);
      return;
    }

    console.log(`✅ Created template: ${template.name} (ID: ${template.id})`);

    // 3. Test video generation API
    console.log('\n🎥 Testing video generation...');
    const response = await fetch('http://localhost:3000/api/videos/generate-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: template.id,
        childName: 'TestChild',
        userId: 'test-user-id'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Video generation started successfully!');
      console.log(`📹 Video Asset ID: ${result.videoAsset.id}`);
      console.log(`⏱️ Total Duration: ${result.totalDuration} seconds`);
      console.log(`🎵 Assets Used: ${result.assetsCount}`);
    } else {
      const error = await response.json();
      console.error('❌ Video generation failed:', error);
    }

    // 4. Clean up test template
    console.log('\n🧹 Cleaning up test template...');
    const { error: deleteError } = await supabase
      .from('video_templates')
      .delete()
      .eq('id', template.id);

    if (deleteError) {
      console.error('❌ Error deleting test template:', deleteError);
    } else {
      console.log('✅ Test template cleaned up');
    }

    console.log('\n🎉 Template video generation test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTemplateVideoGeneration(); 