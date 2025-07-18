require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAssetProjectIds() {
  try {
    console.log('🔧 Fixing project_id for the two new audio assets...');
    
    const assetIds = [
      '6e267312-b426-489f-9343-76ebf435a5c4', 
      'fb258fe1-a7bd-4ace-856a-8d840c751231'
    ];
    
    for (const assetId of assetIds) {
      console.log(`\n🔧 Fixing asset ${assetId}...`);
      
      // First, get the asset to see its metadata project_id
      const { data: asset, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();
      
      if (fetchError) {
        console.error(`❌ Error fetching asset ${assetId}:`, fetchError);
        continue;
      }
      
      if (!asset) {
        console.log(`❌ Asset ${assetId} not found`);
        continue;
      }
      
      const metadataProjectId = asset.metadata?.project_id;
      console.log(`📋 Current DB project_id: ${asset.project_id}`);
      console.log(`📋 Metadata project_id: ${metadataProjectId}`);
      
      if (metadataProjectId && asset.project_id !== metadataProjectId) {
        console.log(`🔧 Updating DB project_id to: ${metadataProjectId}`);
        
        const { error: updateError } = await supabase
          .from('assets')
          .update({ project_id: metadataProjectId })
          .eq('id', assetId);
        
        if (updateError) {
          console.error(`❌ Error updating asset ${assetId}:`, updateError);
        } else {
          console.log(`✅ Successfully updated asset ${assetId}`);
        }
      } else {
        console.log(`✅ Asset ${assetId} project_id is already correct`);
      }
    }
    
    console.log('\n✅ Project ID fix complete!');
    
  } catch (error) {
    console.error('💥 Error in fix script:', error);
  }
}

fixAssetProjectIds();
