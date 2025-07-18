require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixWishButtonAssets() {
  console.log('🔧 Fixing Wish Button Assets...\n');

  try {
    // 1. Find all assets with wish-button template
    console.log('1. Finding wish-button assets...');
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .eq('metadata->>template', 'wish-button')
      .order('created_at', { ascending: false });

    if (assetsError) {
      console.error('❌ Error fetching wish-button assets:', assetsError);
      return;
    }

    console.log(`Found ${assets?.length || 0} wish-button assets to fix`);

    if (!assets || assets.length === 0) {
      console.log('No wish-button assets found to fix.');
      return;
    }

    // 2. Fix each asset
    let fixedCount = 0;
    for (const asset of assets) {
      console.log(`\n🔧 Fixing asset ${asset.id}...`);
      
      const updates = {};
      let needsUpdate = false;

      // Fix URL field if missing
      if (!asset.url && asset.file_url) {
        updates.url = asset.file_url;
        needsUpdate = true;
        console.log(`  - Setting url to file_url: ${asset.file_url}`);
      }

      // Fix metadata if missing page/asset_purpose
      const metadata = asset.metadata || {};
      let metadataUpdated = false;

      if (!metadata.page && !metadata.asset_purpose) {
        // Try to extract page from prompt if available
        if (asset.prompt_id) {
          const { data: prompt } = await supabase
            .from('prompts')
            .select('metadata')
            .eq('id', asset.prompt_id)
            .single();

          if (prompt?.metadata?.page) {
            metadata.page = prompt.metadata.page;
            metadata.asset_purpose = prompt.metadata.page;
            metadataUpdated = true;
            console.log(`  - Setting page and asset_purpose from prompt: ${prompt.metadata.page}`);
          }
        }
      }

      // Ensure template is set
      if (!metadata.template) {
        metadata.template = 'wish-button';
        metadataUpdated = true;
        console.log(`  - Setting template: wish-button`);
      }

      if (metadataUpdated) {
        updates.metadata = metadata;
        needsUpdate = true;
      }

      // Update the asset if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('assets')
          .update(updates)
          .eq('id', asset.id);

        if (updateError) {
          console.error(`  ❌ Failed to update asset ${asset.id}:`, updateError);
        } else {
          fixedCount++;
          console.log(`  ✅ Fixed asset ${asset.id}`);
        }
      } else {
        console.log(`  - Asset ${asset.id} already correct`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} out of ${assets.length} assets`);

    // 3. Verify the fixes
    console.log('\n3. Verifying fixes...');
    const { data: fixedAssets, error: verifyError } = await supabase
      .from('assets')
      .select('id, url, metadata->page, metadata->asset_purpose, metadata->template')
      .eq('metadata->>template', 'wish-button')
      .order('created_at', { ascending: false })
      .limit(5);

    if (verifyError) {
      console.error('❌ Error verifying fixes:', verifyError);
      return;
    }

    console.log('\nVerification results:');
    fixedAssets?.forEach(asset => {
      console.log(`- Asset ${asset.id}:`, {
        hasUrl: !!asset.url,
        page: asset.metadata?.page,
        asset_purpose: asset.metadata?.asset_purpose,
        template: asset.metadata?.template
      });
    });

  } catch (error) {
    console.error('💥 Error in fix script:', error);
  }
}

// Run the fix function
fixWishButtonAssets().then(() => {
  console.log('\n✅ Fix complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 