require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLetterHuntDetection() {
  console.log('🔍 Testing Letter Hunt asset detection logic...\n');
  
  const targetLetter = 'A';
  
  try {
    // Test each image type with the same query logic as the frontend
    const imageTypes = ['signImage', 'bookImage', 'groceryImage'];
    
    for (const imageType of imageTypes) {
      console.log(`\n📸 Testing ${imageType} detection for letter ${targetLetter}:`);
      
      const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .eq('type', 'image')
        .eq('status', 'approved')
        .eq('metadata->>template', 'letter-hunt')
        .eq('metadata->>imageType', imageType)
        .eq('metadata->>targetLetter', targetLetter)
        .or(`metadata->>child_name.is.null,metadata->>child_name.eq.`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`❌ Error querying ${imageType}:`, error);
        continue;
      }

      console.log(`   Found ${assets?.length || 0} approved ${imageType} assets for letter ${targetLetter}`);
      
      if (assets && assets.length > 0) {
        assets.forEach((asset, index) => {
          console.log(`   ${index + 1}. ${asset.id} - Status: ${asset.status} - Letter: ${asset.metadata?.targetLetter}`);
        });
      } else {
        console.log(`   ❌ No ${imageType} assets found - would show "Create Assets" button`);
      }
    }

    // Also test the titleCard detection for comparison
    console.log(`\n📋 Testing titleCard detection for letter ${targetLetter}:`);
    
    const { data: titleAssets, error: titleError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'image')
      .eq('status', 'approved')
      .eq('metadata->>template', 'letter-hunt')
      .eq('metadata->>imageType', 'titleCard')
      .eq('metadata->>targetLetter', targetLetter)
      .or(`metadata->>child_name.is.null,metadata->>child_name.eq.`)
      .order('created_at', { ascending: false });

    if (titleError) {
      console.error('❌ Error querying titleCard:', titleError);
    } else {
      console.log(`   Found ${titleAssets?.length || 0} approved titleCard assets for letter ${targetLetter}`);
      
      if (titleAssets && titleAssets.length > 0) {
        titleAssets.forEach((asset, index) => {
          console.log(`   ${index + 1}. ${asset.id} - Status: ${asset.status} - Letter: ${asset.metadata?.targetLetter}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testLetterHuntDetection();
