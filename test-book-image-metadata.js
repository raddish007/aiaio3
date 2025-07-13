require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBookImageMetadata() {
  console.log('🔍 Testing bookImage asset metadata handling...\n');
  
  try {
    // Find the most recent bookImage asset that was created
    const { data: bookAssets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'image')
      .eq('metadata->>imageType', 'bookImage')
      .eq('metadata->>template', 'letter-hunt')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching bookImage assets:', error);
      return;
    }

    console.log(`📦 Found ${bookAssets?.length || 0} bookImage assets:`);
    
    if (bookAssets && bookAssets.length > 0) {
      bookAssets.forEach((asset, index) => {
        console.log(`\n${index + 1}. Asset ID: ${asset.id}`);
        console.log(`   Status: ${asset.status}`);
        console.log(`   Created: ${asset.created_at}`);
        console.log(`   Target Letter: ${asset.metadata?.targetLetter || 'MISSING'}`);
        console.log(`   Child Name: "${asset.metadata?.child_name || 'MISSING'}"`);
        console.log(`   Image Type: ${asset.metadata?.imageType || 'MISSING'}`);
        console.log(`   Template: ${asset.metadata?.template || 'MISSING'}`);
        console.log(`   File URL: ${asset.file_url}`);
        
        // Check if all required fields are present for moderation
        const hasTargetLetter = !!asset.metadata?.targetLetter;
        const hasImageType = !!asset.metadata?.imageType;
        const hasTemplate = !!asset.metadata?.template;
        
        console.log(`   ✅ Moderation fields:`, {
          targetLetter: hasTargetLetter ? '✅' : '❌',
          imageType: hasImageType ? '✅' : '❌',
          template: hasTemplate ? '✅' : '❌'
        });
        
        if (!hasTargetLetter) {
          console.log('   🚨 ISSUE: targetLetter missing from metadata - will not show in moderation properly');
        }
        
        console.log(`   📋 Full metadata:`, JSON.stringify(asset.metadata, null, 2));
      });
    } else {
      console.log('❌ No bookImage assets found');
      
      // Look for any recent Letter Hunt image assets as fallback
      const { data: anyImages } = await supabase
        .from('assets')
        .select('*')
        .eq('type', 'image')
        .eq('metadata->>template', 'letter-hunt')
        .order('created_at', { ascending: false })
        .limit(3);

      console.log(`\n📸 Recent Letter Hunt image assets as fallback:`);
      anyImages?.forEach((asset, index) => {
        console.log(`${index + 1}. ${asset.id} - ${asset.metadata?.imageType || 'unknown'} - Letter ${asset.metadata?.targetLetter || 'missing'}`);
      });
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testBookImageMetadata();
