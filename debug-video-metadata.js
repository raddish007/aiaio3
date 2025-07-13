const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugVideoMetadata() {
  console.log('🔍 Debugging video metadata...\n');

  try {
    // Get a few videos from child_approved_videos
    const { data: videos, error } = await supabase
      .from('child_approved_videos')
      .select('*')
      .limit(2);

    if (error) {
      console.error('Error fetching videos:', error);
      return;
    }

    console.log(`📹 Found ${videos.length} videos:\n`);

    for (const video of videos) {
      console.log(`=== Video: ${video.video_title} ===`);
      console.log('ID:', video.id);
      console.log('Video Generation Job ID:', video.video_generation_job_id);
      console.log('Template Type:', video.template_type);
      console.log('Child Name:', video.child_name);
      console.log('Child Theme:', video.child_theme);
      console.log('Used Assets:', video.used_assets);
      console.log('');

      // Test the asset fetching logic
      await testAssetFetching(video);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

async function testAssetFetching(video) {
  console.log('🔍 Testing asset fetching for video:', video.id);
  
  try {
    if (video.video_generation_job_id) {
      console.log('📋 Fetching video generation job:', video.video_generation_job_id);
      
      const { data: job, error: jobError } = await supabase
        .from('video_generation_jobs')
        .select('*')
        .eq('id', video.video_generation_job_id)
        .single();

      if (jobError) {
        console.error('❌ Error fetching job:', jobError);
        return;
      }

      console.log('✅ Job found:', {
        id: job.id,
        status: job.status,
        segments: job.segments ? 'Has segments' : 'No segments',
        segmentsLength: job.segments?.length || 0
      });

      // Extract asset IDs from segments
      const assetIds = new Set();
      
      if (job.segments && Array.isArray(job.segments)) {
        console.log('🔍 Extracting asset IDs from segments...');
        
        job.segments.forEach((segment, index) => {
          console.log(`  Segment ${index}:`, JSON.stringify(segment, null, 2));
          
          // Extract asset IDs from various possible locations
          if (segment.assets && Array.isArray(segment.assets)) {
            segment.assets.forEach((asset) => {
              if (asset.asset_id) {
                assetIds.add(asset.asset_id);
                console.log(`    Found asset_id: ${asset.asset_id}`);
              }
              if (asset.id) {
                assetIds.add(asset.id);
                console.log(`    Found id: ${asset.id}`);
              }
            });
          }
          if (segment.asset_id) {
            assetIds.add(segment.asset_id);
            console.log(`    Found segment.asset_id: ${segment.asset_id}`);
          }
          if (segment.audio_asset_id) {
            assetIds.add(segment.audio_asset_id);
            console.log(`    Found audio_asset_id: ${segment.audio_asset_id}`);
          }
          if (segment.image_asset_id) {
            assetIds.add(segment.image_asset_id);
            console.log(`    Found image_asset_id: ${segment.image_asset_id}`);
          }
          if (segment.background_asset_id) {
            assetIds.add(segment.background_asset_id);
            console.log(`    Found background_asset_id: ${segment.background_asset_id}`);
          }
        });
      }

      // Also check used_assets
      if (video.used_assets && Array.isArray(video.used_assets)) {
        video.used_assets.forEach((assetId) => {
          assetIds.add(assetId);
          console.log(`    Found in used_assets: ${assetId}`);
        });
      }

      console.log('📦 Total unique asset IDs found:', assetIds.size);
      console.log('Asset IDs:', Array.from(assetIds));

      if (assetIds.size > 0) {
        const { data: assets, error: assetsError } = await supabase
          .from('assets')
          .select('*')
          .in('id', Array.from(assetIds));

        if (assetsError) {
          console.error('❌ Error fetching assets:', assetsError);
          return;
        }

        console.log(`✅ Found ${assets.length} assets:`);
        assets.forEach((asset, index) => {
          console.log(`  Asset ${index + 1}:`);
          console.log(`    ID: ${asset.id}`);
          console.log(`    Type: ${asset.type}`);
          console.log(`    Theme: ${asset.theme}`);
          console.log(`    File URL: ${asset.file_url}`);
          console.log(`    Metadata:`, asset.metadata);
          console.log('');
        });

        // Test template defaults
        await testTemplateDefaults(video, assets);
      } else {
        console.log('❌ No asset IDs found');
      }
    } else {
      console.log('❌ No video_generation_job_id found');
    }
  } catch (error) {
    console.error('❌ Error in testAssetFetching:', error);
  }
}

async function testTemplateDefaults(video, assets) {
  console.log('🔍 Testing template defaults...');
  
  try {
    const { data: templateDefaults, error } = await supabase
      .from('template_defaults')
      .select('*')
      .eq('template_type', video.template_type);

    if (error) {
      console.error('❌ Error fetching template defaults:', error);
      return;
    }

    console.log(`✅ Found ${templateDefaults.length} template defaults for ${video.template_type}:`);
    
    templateDefaults.forEach((template, index) => {
      console.log(`  Template ${index + 1}:`);
      console.log(`    ID: ${template.id}`);
      console.log(`    Template Type: ${template.template_type}`);
      console.log(`    Default Image Class: ${template.default_display_image_class}`);
      console.log(`    Default Image URL: ${template.default_display_image_url}`);
      console.log('');

      // Test the display image logic
      if (template.template_type === 'letter-hunt' && template.default_display_image_class) {
        console.log(`🔍 Looking for assets with class: ${template.default_display_image_class}`);
        
        const found = assets.find(a => {
          const assetKey = a.metadata?.imageType || a.metadata?.assetPurpose || a.metadata?.videoType;
          console.log(`    Checking asset ${a.id}: ${assetKey} vs ${template.default_display_image_class}`);
          return assetKey === template.default_display_image_class;
        });
        
        if (found) {
          console.log(`✅ Found matching asset: ${found.id} - ${found.file_url}`);
        } else {
          console.log(`❌ No matching asset found`);
          
          // Show all image assets as fallback
          const imageAssets = assets.filter(a => a.type === 'image');
          console.log(`📸 Available image assets (${imageAssets.length}):`);
          imageAssets.forEach(asset => {
            console.log(`    ${asset.id}: ${asset.theme} - ${asset.file_url}`);
          });
        }
      }
    });
  } catch (error) {
    console.error('❌ Error in testTemplateDefaults:', error);
  }
}

debugVideoMetadata(); 