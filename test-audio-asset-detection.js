require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAudioAssetDetection() {
  console.log('🔍 Testing Letter Hunt audio asset detection...\n');
  
  const targetLetter = 'A';
  
  try {
    // Test audio asset detection with the same query logic as the frontend
    const audioTypes = ['signAudio', 'bookAudio', 'groceryAudio'];
    
    console.log(`🎵 Testing general audio assets (not letter-specific):`);
    
    for (const audioType of audioTypes) {
      console.log(`\n📻 Testing ${audioType} detection:`);
      
      // Query for general audio assets (these should be general, not letter-specific)
      const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .eq('type', 'audio')
        .eq('status', 'approved')
        .eq('metadata->>template', 'letter-hunt')
        .eq('metadata->>assetPurpose', audioType)
        .or('metadata->>child_name.is.null,metadata->>child_name.eq.')
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`❌ Error querying ${audioType}:`, error);
        continue;
      }

      console.log(`   Found ${assets?.length || 0} approved ${audioType} assets`);
      
      if (assets && assets.length > 0) {
        assets.forEach((asset, index) => {
          console.log(`   ${index + 1}. ${asset.id} - Status: ${asset.status}`);
          console.log(`      Script: "${asset.metadata?.script || 'No script'}"`);
          console.log(`      Asset Purpose: ${asset.metadata?.assetPurpose}`);
          console.log(`      Template: ${asset.metadata?.template}`);
          console.log(`      Child Name: "${asset.metadata?.child_name || 'general'}"`);
          console.log(`      Created: ${asset.created_at}`);
        });
      } else {
        console.log(`   ❌ No ${audioType} assets found - would show "Create Assets" button`);
      }
    }

    // Also check for any audio assets we might have that could be the right ones but with wrong metadata
    console.log(`\n🔍 Checking for any Letter Hunt audio assets that might need metadata fixes:`);
    
    const { data: allAudioAssets, error: allError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'audio')
      .eq('metadata->>template', 'letter-hunt')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error querying all audio assets:', allError);
    } else {
      console.log(`\n📋 All Letter Hunt audio assets in database:`);
      
      allAudioAssets?.forEach((asset, index) => {
        console.log(`${index + 1}. ${asset.id} - ${asset.status}`);
        console.log(`   Asset Purpose: ${asset.metadata?.assetPurpose || 'MISSING'}`);
        console.log(`   Script: "${asset.metadata?.script || 'No script'}"`);
        console.log(`   Child Name: "${asset.metadata?.child_name || 'general'}"`);
        console.log(`   File URL: ${asset.file_url}`);
        console.log(`   Created: ${asset.created_at}`);
        
        // Check if this could be one of our target audio types based on script content
        const script = asset.metadata?.script?.toLowerCase() || '';
        if (script.includes('on signs')) {
          console.log(`   🎯 This looks like signAudio! Script matches "On signs"`);
        } else if (script.includes('on books')) {
          console.log(`   🎯 This looks like bookAudio! Script matches "On books"`);
        } else if (script.includes('grocery store')) {
          console.log(`   🎯 This looks like groceryAudio! Script matches grocery store`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testAudioAssetDetection();
