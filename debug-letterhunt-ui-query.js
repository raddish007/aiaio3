require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLetterHuntUIQuery() {
  console.log('🔍 Testing Letter Hunt UI query exactly as the frontend does...\n');
  
  const targetLetter = 'A';
  const childName = 'Andrew';
  
  try {
    // This is the exact query from the Letter Hunt UI for letter-specific audio assets
    console.log('📻 Testing letter-specific audio assets query:');
    
    const { data: letterSpecificAudioAssets, error: letterAudioError } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio')
      .eq('metadata->>targetLetter', targetLetter)
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

    if (letterAudioError) {
      console.error('❌ Error in letter-specific audio query:', letterAudioError);
    } else {
      console.log(`Found ${letterSpecificAudioAssets?.length || 0} letter-specific audio assets:`);
      letterSpecificAudioAssets?.forEach(asset => {
        console.log(`  - ${asset.id}: ${asset.metadata?.assetPurpose} (targetLetter: ${asset.metadata?.targetLetter})`);
      });
    }

    // Test the full combined query that the UI uses
    console.log('\n🔍 Testing full combined asset query (like Letter Hunt UI):');
    
    // 1. Child-specific Letter Hunt assets
    const { data: specificAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('metadata->>child_name', childName)
      .eq('metadata->>targetLetter', targetLetter);

    // 2. Letter-specific Letter Hunt assets (not tied to specific child)
    const { data: letterSpecificAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('metadata->>targetLetter', targetLetter)
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

    // 3. Letter-specific audio assets (audio only, not tied to specific child)
    const { data: letterSpecificAudioAssets2 } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio')
      .eq('metadata->>targetLetter', targetLetter)
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

    // 4. Generic Letter Hunt video assets (not tied to specific child/letter)
    const { data: genericVideoAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'video')
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.')
      .is('metadata->>targetLetter', null);

    // 5. Generic Letter Hunt audio assets (not tied to specific child/letter)
    const { data: genericAudioAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'audio')
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.')
      .is('metadata->>targetLetter', null);

    // 6. Letter Hunt image assets that match the target letter (not tied to specific child)
    const { data: letterSpecificImageAssets } = await supabase
      .from('assets')
      .select('*')
      .in('status', ['approved', 'pending'])
      .eq('metadata->>template', 'letter-hunt')
      .eq('type', 'image')
      .eq('metadata->>targetLetter', targetLetter)
      .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

    // Combine all sets of assets, prioritizing specific > letter-specific > generic
    const existingAssets = [
      ...(specificAssets || []),
      ...(letterSpecificAssets || []),
      ...(letterSpecificAudioAssets2 || []),
      ...(genericVideoAssets || []),
      ...(genericAudioAssets || []),
      ...(letterSpecificImageAssets || [])
    ];

    console.log(`\nCombined results:`);
    console.log(`- Child-specific: ${specificAssets?.length || 0}`);
    console.log(`- Letter-specific: ${letterSpecificAssets?.length || 0}`);
    console.log(`- Letter-specific audio: ${letterSpecificAudioAssets2?.length || 0}`);
    console.log(`- Generic video: ${genericVideoAssets?.length || 0}`);
    console.log(`- Generic audio: ${genericAudioAssets?.length || 0}`);
    console.log(`- Letter-specific images: ${letterSpecificImageAssets?.length || 0}`);
    console.log(`- Total combined: ${existingAssets?.length || 0}`);

    console.log('\n📋 All assets found:');
    existingAssets?.forEach(asset => {
      console.log(`  ${asset.type}: ${asset.metadata?.assetPurpose || asset.metadata?.imageType || asset.metadata?.videoType} (targetLetter: ${asset.metadata?.targetLetter}, child: ${asset.metadata?.child_name})`);
    });

    // Now test what our signAudio, bookAudio, groceryAudio actually have
    console.log('\n🎵 Checking our specific audio assets:');
    
    const audioIds = [
      '8ece91d1-aa24-4692-ab93-689ecd52275d', // signAudio
      '26d5aea8-dbe3-4697-bbda-ac06b7c7868a', // bookAudio
      'd189dd06-1e78-4cb5-a287-fdf7c3aa5d64'  // groceryAudio
    ];

    for (const id of audioIds) {
      const { data: asset } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();

      if (asset) {
        console.log(`\n${asset.metadata?.assetPurpose}:`);
        console.log(`  ID: ${asset.id}`);
        console.log(`  Status: ${asset.status}`);
        console.log(`  Type: ${asset.type}`);
        console.log(`  Template: ${asset.metadata?.template}`);
        console.log(`  Target Letter: ${asset.metadata?.targetLetter}`);
        console.log(`  Child Name: "${asset.metadata?.child_name}"`);
        console.log(`  Asset Purpose: ${asset.metadata?.assetPurpose}`);
        
        // Test if this asset would match the letter-specific audio query
        const shouldMatch = (
          asset.status === 'approved' &&
          asset.metadata?.template === 'letter-hunt' &&
          asset.type === 'audio' &&
          asset.metadata?.targetLetter === targetLetter &&
          (asset.metadata?.child_name === null || asset.metadata?.child_name === '')
        );
        
        console.log(`  Would match letter-specific audio query: ${shouldMatch}`);
      }
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testLetterHuntUIQuery();
