const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAssetImageTypes() {
  try {
    // Get all letter hunt assets with empty imageType
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'image')
      .eq('metadata->>imageType', '')
      .in('status', ['approved', 'pending']);

    if (error) {
      console.error('Error fetching assets:', error);
      return;
    }

    console.log(`Found ${assets?.length || 0} assets with empty imageType`);

    if (!assets || assets.length === 0) {
      console.log('No assets to fix');
      return;
    }

    let fixedCount = 0;
    for (const asset of assets) {
      // Determine the correct imageType based on prompt content
      let correctImageType = '';
      const prompt = asset.metadata?.prompt?.toLowerCase() || '';
      
      if (prompt.includes('street sign') || prompt.includes('sign') || prompt.includes('road sign')) {
        correctImageType = 'signImage';
      } else if (prompt.includes('book') || prompt.includes('cover') || prompt.includes('reading')) {
        correctImageType = 'bookImage';
      } else if (prompt.includes('grocery') || prompt.includes('store') || prompt.includes('cereal') || prompt.includes('food') || prompt.includes('can') || prompt.includes('jar') || prompt.includes('box')) {
        correctImageType = 'groceryImage';
      } else if (prompt.includes('ending') || prompt.includes('goodbye') || prompt.includes('wave')) {
        correctImageType = 'endingImage';
      }

      if (correctImageType) {
        console.log(`Fixing asset ${asset.id}: ${correctImageType}`);
        
        const { error: updateError } = await supabase
          .from('assets')
          .update({
            metadata: {
              ...asset.metadata,
              imageType: correctImageType
            }
          })
          .eq('id', asset.id);

        if (updateError) {
          console.error(`Error updating asset ${asset.id}:`, updateError);
        } else {
          fixedCount++;
        }
      } else {
        console.log(`Could not determine imageType for asset ${asset.id}:`, prompt.substring(0, 100) + '...');
      }
    }

    console.log(`✅ Fixed ${fixedCount} assets`);

  } catch (error) {
    console.error('Fix failed:', error);
  }
}

fixAssetImageTypes(); 