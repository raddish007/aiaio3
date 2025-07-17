const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAssetDetection() {
  try {
    const nameToUse = 'Nolan';
    const targetLetter = 'N';
    
    const { data: letterSpecificImageAssets, error } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'image')
      .eq('metadata->>targetLetter', targetLetter)
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

    if (error) {
      console.error('Query error:', error);
      return;
    }

    console.log('Letter-specific images found:', letterSpecificImageAssets?.length || 0);
    
    if (letterSpecificImageAssets && letterSpecificImageAssets.length > 0) {
      console.log('Found assets:');
      letterSpecificImageAssets.forEach(asset => {
        console.log('- ID:', asset.id);
        console.log('  imageType:', asset.metadata?.imageType);
        console.log('  prompt:', asset.metadata?.prompt?.substring(0, 80) + '...');
        console.log('  ---');
      });
    }

    const assetsByType = {};
    letterSpecificImageAssets?.forEach(asset => {
      let assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
      
      if (!assetKey && asset.type === 'image' && asset.metadata?.prompt) {
        const prompt = asset.metadata.prompt.toLowerCase();
        if (prompt.includes('street sign') || prompt.includes('sign') || prompt.includes('road sign')) {
          assetKey = 'signImage';
        } else if (prompt.includes('book') || prompt.includes('cover') || prompt.includes('reading')) {
          assetKey = 'bookImage';
        } else if (prompt.includes('grocery') || prompt.includes('store') || prompt.includes('cereal') || prompt.includes('food')) {
          assetKey = 'groceryImage';
        } else if (prompt.includes('ending') || prompt.includes('goodbye') || prompt.includes('wave')) {
          assetKey = 'endingImage';
        }
      }
      
      if (assetKey) {
        if (!assetsByType[assetKey]) assetsByType[assetKey] = [];
        assetsByType[assetKey].push(asset);
      }
    });

    console.log('Mapped assets by type:');
    Object.keys(assetsByType).forEach(key => {
      console.log(key + ': ' + assetsByType[key].length + ' assets');
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAssetDetection(); 