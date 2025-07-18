require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugNewAudioAssets() {
  try {
    console.log('🔍 Debugging the two new audio assets...');
    
    const assetIds = [
      '6e267312-b426-489f-9343-76ebf435a5c4', 
      'fb258fe1-a7bd-4ace-856a-8d840c751231'
    ];
    
    for (const assetId of assetIds) {
      console.log(`\n📊 Asset ID: ${assetId}`);
      console.log('=' + '='.repeat(50));
      
      const { data: asset, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();
      
      if (error) {
        console.error(`❌ Error fetching asset ${assetId}:`, error);
        continue;
      }
      
      if (!asset) {
        console.log(`❌ Asset ${assetId} not found`);
        continue;
      }
      
      console.log('📋 Basic Info:');
      console.log(`  Type: ${asset.type}`);
      console.log(`  Status: ${asset.status}`);
      console.log(`  Project ID: ${asset.project_id}`);
      console.log(`  File URL: ${asset.file_url}`);
      console.log(`  Created: ${asset.created_at}`);
      
      console.log('\n📋 Metadata Analysis:');
      const metadata = asset.metadata || {};
      console.log(`  Metadata keys: [${Object.keys(metadata).join(', ')}]`);
      console.log(`  Template: ${metadata.template}`);
      console.log(`  Asset Purpose: ${metadata.asset_purpose}`);
      console.log(`  Page: ${metadata.page}`);
      console.log(`  Template Context: ${JSON.stringify(metadata.template_context, null, 2)}`);
      
      // Check for the huge audio_data field
      if (metadata.audio_data) {
        console.log(`  🚨 Audio Data Size: ${metadata.audio_data.length} chars`);
        console.log(`  🚨 Audio Data Preview: ${metadata.audio_data.substring(0, 100)}...`);
      } else {
        console.log(`  ✅ No audio_data field (clean metadata)`);
      }
      
      console.log('\n📋 Full Metadata:');
      console.log(JSON.stringify(metadata, null, 2));
      
      // Test the UI mapping logic
      console.log('\n🎯 UI Mapping Test:');
      const assetPurpose = metadata.asset_purpose || 
                         metadata.template_context?.asset_purpose ||
                         metadata.page ||
                         metadata.assetPurpose;
      const assetType = asset.type;
      
      let assetKey = '';
      if (assetPurpose && assetType === 'image') {
        assetKey = `${assetPurpose}_image`;
      } else if (assetPurpose && assetType === 'audio') {
        assetKey = `${assetPurpose}_audio`;
      } else if (assetPurpose === 'background_music') {
        assetKey = 'background_music';
      }
      
      console.log(`  Extracted Purpose: ${assetPurpose}`);
      console.log(`  Asset Type: ${assetType}`);
      console.log(`  Computed Key: ${assetKey}`);
      console.log(`  Expected Key for UI: ${assetPurpose}_audio`);
      console.log(`  Key Match: ${assetKey === `${assetPurpose}_audio`}`);
    }
    
    // Also check what project these belong to
    console.log('\n🔍 Project Check:');
    const { data: projects, error: projectError } = await supabase
      .from('content_projects')
      .select('id, title, metadata')
      .in('id', ['project-id-from-assets']); // We'll get this from the assets
    
    if (projectError) {
      console.error('❌ Error fetching projects:', projectError);
    } else {
      console.log('📋 Found projects:', projects);
    }
    
  } catch (error) {
    console.error('💥 Error in debug script:', error);
  }
}

debugNewAudioAssets();
