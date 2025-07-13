require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findSignImageAsset() {
  console.log('🔍 Looking for signImage assets...\n');

  try {
    // Look for signImage assets specifically
    const { data: signImageAssets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'image')
      .eq('metadata->>imageType', 'signImage')
      .eq('metadata->>template', 'letter-hunt');

    if (error) {
      console.error('❌ Error fetching assets:', error);
      return;
    }

    console.log(`📦 Found ${signImageAssets?.length || 0} signImage assets:`);
    
    if (signImageAssets && signImageAssets.length > 0) {
      signImageAssets.forEach((asset, index) => {
        console.log(`\n${index + 1}. Asset ID: ${asset.id}`);
        console.log(`   Status: ${asset.status}`);
        console.log(`   Child Name: ${asset.metadata?.child_name || 'N/A'}`);
        console.log(`   Target Letter: ${asset.metadata?.targetLetter || 'N/A'}`);
        console.log(`   File URL: ${asset.file_url}`);
        console.log(`   Created: ${asset.created_at}`);
        console.log(`   Metadata:`, JSON.stringify(asset.metadata, null, 2));
      });
    } else {
      console.log('❌ No signImage assets found');
      
      // Let's also check for any recently approved image assets
      const { data: recentImages } = await supabase
        .from('assets')
        .select('*')
        .eq('type', 'image')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('\n📸 Recent approved image assets:');
      recentImages?.forEach((asset, index) => {
        console.log(`${index + 1}. ${asset.id} - ${asset.metadata?.imageType || 'unknown type'} - ${asset.metadata?.child_name || 'no child'} - Letter ${asset.metadata?.targetLetter || 'no letter'}`);
      });
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

findSignImageAsset();
