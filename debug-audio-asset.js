require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:', {
  url: supabaseUrl ? 'SET' : 'NOT SET',
  key: supabaseKey ? 'SET' : 'NOT SET'
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAudioAsset() {
  try {
    // Check the specific audio asset
    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', '732fcd55-2901-462b-9712-97b27a82822c')
      .single();

    if (error) {
      console.error('Error fetching asset:', error);
      return;
    }

    console.log('=== AUDIO ASSET DEBUG ===');
    console.log('ID:', asset.id);
    console.log('Type:', asset.type);
    console.log('Status:', asset.status);
    console.log('Project ID:', asset.project_id);
    console.log('Metadata:', JSON.stringify(asset.metadata, null, 2));
    
    // Check what the filtering logic would find
    const metadata = asset.metadata || {};
    const isWishButton = (
      metadata.template === 'wish-button' ||
      metadata.template_context?.template_type === 'wish-button'
    );
    
    console.log('\n=== FILTERING CHECK ===');
    console.log('metadata.template:', metadata.template);
    console.log('metadata.template_context?.template_type:', metadata.template_context?.template_type);
    console.log('Would be filtered as wish-button:', isWishButton);
    
    // Check asset purpose extraction
    const assetPurpose = metadata.asset_purpose || 
                       metadata.template_context?.asset_purpose ||
                       metadata.page ||
                       metadata.assetPurpose;
    
    console.log('\n=== ASSET PURPOSE EXTRACTION ===');
    console.log('metadata.asset_purpose:', metadata.asset_purpose);
    console.log('metadata.template_context?.asset_purpose:', metadata.template_context?.asset_purpose);
    console.log('metadata.page:', metadata.page);
    console.log('metadata.assetPurpose:', metadata.assetPurpose);
    console.log('Extracted asset purpose:', assetPurpose);
    
    const assetKey = assetPurpose && asset.type === 'audio' ? `${assetPurpose}_audio` : '';
    console.log('Generated UI key:', assetKey);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugAudioAsset().then(() => process.exit(0));
