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

async function testLullabyWorkflow() {
  console.log('🌙 Testing Lullaby Video Workflow\n');

  try {
    // 1. Check available children
    console.log('1️⃣ Checking available children...');
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .order('name');

    if (childrenError || !children || children.length === 0) {
      console.error('❌ No children found or error:', childrenError);
      return;
    }

    console.log(`✅ Found ${children.length} children:`);
    children.forEach(child => {
      console.log(`   - ${child.name} (age ${child.age}, theme: ${child.primary_interest})`);
    });

    const testChild = children[0];
    console.log(`\n🎯 Using test child: ${testChild.name}\n`);

    // 2. Check lullaby asset requirements
    console.log('2️⃣ Checking lullaby asset requirements...');
    
    const assetRequirements = [
      { purpose: 'intro_audio', type: 'audio', class: 'lullaby_intro' },
      { purpose: 'outro_audio', type: 'audio', class: 'lullaby_outro' },
      { purpose: 'background_music', type: 'audio', class: 'lullaby_music' },
      { purpose: 'intro_background', type: 'image', class: 'lullaby_intro_bg' },
      { purpose: 'outro_background', type: 'image', class: 'lullaby_outro_bg' },
      { purpose: 'slideshow_images', type: 'image', class: 'lullaby_slideshow' }
    ];

    const assetStatus = {};
    let missingAssets = [];

    for (const req of assetRequirements) {
      const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .eq('type', req.type)
        .eq('status', 'approved')
        .contains('tags', [req.class])
        .limit(1);

      if (assets && assets.length > 0) {
        assetStatus[req.purpose] = {
          available: true,
          asset: assets[0],
          count: assets.length
        };
        console.log(`   ✅ ${req.purpose}: Available (${assets[0].theme})`);
      } else {
        assetStatus[req.purpose] = {
          available: false,
          count: 0
        };
        missingAssets.push(req.purpose);
        console.log(`   ❌ ${req.purpose}: Missing`);
      }
    }

    // 3. Check if we have enough assets for a lullaby video
    console.log('\n3️⃣ Asset availability summary:');
    const requiredAssets = ['intro_audio', 'outro_audio', 'background_music', 'intro_background', 'outro_background'];
    const hasAllRequired = requiredAssets.every(asset => assetStatus[asset]?.available);

    if (hasAllRequired) {
      console.log('✅ All required assets are available!');
      console.log('✅ Ready to generate lullaby video');
    } else {
      console.log('❌ Missing required assets:');
      missingAssets.forEach(asset => {
        if (requiredAssets.includes(asset)) {
          console.log(`   - ${asset}`);
        }
      });
      console.log('\n💡 You can generate missing assets using the AI Generator in the admin panel');
    }

    // 4. Test the lullaby video generation API (if assets are available)
    if (hasAllRequired) {
      console.log('\n4️⃣ Testing lullaby video generation API...');
      
      // Create asset mappings
      const assetMappings = {};
      requiredAssets.forEach(asset => {
        if (assetStatus[asset]?.asset) {
          assetMappings[asset] = assetStatus[asset].asset.id;
        }
      });

      // Add some slideshow images if available
      if (assetStatus.slideshow_images?.available) {
        const { data: slideshowAssets } = await supabase
          .from('assets')
          .select('*')
          .eq('type', 'image')
          .eq('status', 'approved')
          .contains('tags', ['lullaby_slideshow'])
          .limit(5);

        if (slideshowAssets && slideshowAssets.length > 0) {
          assetMappings.slideshow_images = slideshowAssets[0].id;
        }
      }

      // Test API call
      const testPayload = {
        childName: testChild.name,
        childId: testChild.id,
        assets: assetMappings,
        submitted_by: 'test-user'
      };

      console.log('📤 Sending test payload to API...');
      console.log('   Payload:', JSON.stringify(testPayload, null, 2));

      // Note: This would require the Next.js server to be running
      console.log('\n💡 To test the actual API call, start the Next.js server and run:');
      console.log(`   curl -X POST http://localhost:3000/api/videos/generate-lullaby \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(`     -d '${JSON.stringify(testPayload)}'`);
    }

    // 5. Show recent video generation jobs
    console.log('\n5️⃣ Recent video generation jobs:');
    const { data: recentJobs, error: jobsError } = await supabase
      .from('video_generation_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError);
    } else if (recentJobs && recentJobs.length > 0) {
      console.log(`✅ Found ${recentJobs.length} recent jobs:`);
      recentJobs.forEach(job => {
        console.log(`   - ${job.template_id} (${job.status}) - ${new Date(job.created_at).toLocaleString()}`);
      });
    } else {
      console.log('ℹ️  No recent video generation jobs found');
    }

    console.log('\n🎉 Lullaby workflow test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Visit /admin/lullaby-video-request to use the UI');
    console.log('2. Generate missing assets using the AI Generator');
    console.log('3. Submit a lullaby video generation request');
    console.log('4. Monitor progress in the Jobs section');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLullabyWorkflow(); 