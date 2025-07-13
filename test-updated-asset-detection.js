require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUpdatedQueries() {
  console.log('🧪 Testing updated Letter Hunt asset detection queries...\n');
  
  const targetLetter = 'A';
  
  try {
    console.log(`🔤 Testing letter-specific image assets for letter "${targetLetter}":`);
    
    // Test the updated query that should find signImage assets
    const { data: letterSpecificImageAssets, error: letterImageError } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'image')
      .eq('metadata->>targetLetter', targetLetter)
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

    if (letterImageError) {
      console.error('❌ Query error:', letterImageError);
      return;
    }

    console.log(`📦 Found ${letterSpecificImageAssets?.length || 0} letter-specific image assets:`);
    
    if (letterSpecificImageAssets && letterSpecificImageAssets.length > 0) {
      letterSpecificImageAssets.forEach((asset, index) => {
        console.log(`\n${index + 1}. Asset ID: ${asset.id}`);
        console.log(`   Type: ${asset.type}`);
        console.log(`   Status: ${asset.status}`);
        console.log(`   Image Type: ${asset.metadata?.imageType || 'N/A'}`);
        console.log(`   Child Name: "${asset.metadata?.child_name}" (${typeof asset.metadata?.child_name})`);
        console.log(`   Target Letter: ${asset.metadata?.targetLetter || 'N/A'}`);
        console.log(`   File URL: ${asset.file_url}`);
      });

      // Test asset mapping logic
      console.log('\n🗂️ Testing asset mapping logic:');
      const existingByType = new Map();
      
      letterSpecificImageAssets.forEach(asset => {
        const assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
        
        if (assetKey) {
          if (!existingByType.has(assetKey)) {
            existingByType.set(assetKey, []);
          }
          existingByType.get(assetKey).push({
            url: asset.file_url,
            status: 'ready',
            assetId: asset.id,
            generatedAt: asset.created_at
          });
        }
      });

      console.log('\n📋 Mapped assets by type:');
      existingByType.forEach((assets, key) => {
        console.log(`   ${key}: ${assets.length} asset(s) available`);
        assets.forEach((asset, idx) => {
          console.log(`     ${idx + 1}. ${asset.assetId} - ${asset.url}`);
        });
      });

      // Check specifically for signImage
      if (existingByType.has('signImage')) {
        console.log('\n✅ signImage assets found and mapped successfully!');
        console.log('🎯 These will now be detected by the Letter Hunt request interface');
      } else {
        console.log('\n❌ signImage assets not found in mapping');
      }

    } else {
      console.log('❌ No letter-specific image assets found');
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testUpdatedQueries();
