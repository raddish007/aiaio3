const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testHappyDanceQuery() {
  console.log('🧪 Testing Happy Dance Query Logic');
  console.log('==================================');
  
  const childName = 'Andrew';
  const targetLetter = 'A';
  const childTheme = 'halloween';
  
  console.log(`\nTesting with: childName="${childName}", targetLetter="${targetLetter}", childTheme="${childTheme}"`);
  
  console.log('\n1. Simulating the actual Letter Hunt queries:');
  
  // Query 1: Child-specific assets
  console.log('\n   Query 1: Child-specific assets');
  const { data: childSpecific, error: error1 } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('metadata->>child_name', childName)
    .eq('metadata->>targetLetter', targetLetter);
  console.log(`   Results: ${childSpecific?.length || 0} assets`);
  
  // Query 2: Letter-specific video assets  
  console.log('\n   Query 2: Letter-specific video assets');
  const { data: letterSpecific, error: error2 } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'video')
    .eq('metadata->>targetLetter', targetLetter);
  console.log(`   Results: ${letterSpecific?.length || 0} assets`);
  
  // Query 3: Generic video assets (theme-based, no specific letter/child)
  console.log('\n   Query 3: Generic video assets');
  const { data: genericVideo, error: error3 } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'video')
    .or('metadata->>child_name.is.null,metadata->>child_name.eq.')
    .is('metadata->>targetLetter', null);
  console.log(`   Results: ${genericVideo?.length || 0} assets`);
  
  // Query 4: Generic audio assets
  console.log('\n   Query 4: Generic audio assets');
  const { data: genericAudio, error: error4 } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'audio')
    .or('metadata->>child_name.is.null,metadata->>child_name.eq.')
    .is('metadata->>targetLetter', null);
  console.log(`   Results: ${genericAudio?.length || 0} assets`);
  
  // Combine all results like the actual code does
  const allAssets = [
    ...(childSpecific || []),
    ...(letterSpecific || []),
    ...(genericVideo || []),
    ...(genericAudio || [])
  ];
  
  console.log(`\n2. Total assets found: ${allAssets.length}`);
  
  // Check if our Happy Dance asset is in the results
  const happyDanceAssetId = '0dddacc9-b2e1-4d87-9c36-7ffbe121f4fa';
  const foundHappyDance = allAssets.find(asset => asset.id === happyDanceAssetId);
  
  console.log('\n3. Happy Dance Asset Analysis:');
  if (foundHappyDance) {
    console.log('   ✅ Happy Dance asset found in query results!');
    console.log('   Asset metadata:');
    console.log('   - videoType:', foundHappyDance.metadata?.videoType);
    console.log('   - section:', foundHappyDance.metadata?.section);
    console.log('   - template:', foundHappyDance.metadata?.template);
    console.log('   - theme:', foundHappyDance.theme);
    console.log('   - targetLetter:', foundHappyDance.metadata?.targetLetter);
    console.log('   - child_name:', foundHappyDance.metadata?.child_name);
    
    // Simulate the asset key determination logic
    let assetKey = foundHappyDance.metadata?.imageType || foundHappyDance.metadata?.assetPurpose || foundHappyDance.metadata?.videoType;
    console.log('\n   Asset key determination:');
    console.log('   - Calculated assetKey:', assetKey);
    
    if (assetKey === 'happyDanceVideo') {
      console.log('   ✅ Asset key matches expected "happyDanceVideo"');
    } else {
      console.log('   ❌ Asset key does not match expected "happyDanceVideo"');
    }
    
  } else {
    console.log('   ❌ Happy Dance asset NOT found in query results');
    console.log('   This means the asset does not match any of the query criteria');
    
    // Let's fetch the asset directly and see why it doesn't match
    const { data: directAsset, error: directError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', happyDanceAssetId)
      .single();
      
    if (directAsset) {
      console.log('\n   Direct asset fetch successful. Checking why it did not match:');
      console.log('   - status:', directAsset.status, '(needs to be "approved" or "pending")');
      console.log('   - template:', directAsset.metadata?.template, '(needs to be "letter-hunt")');
      console.log('   - type:', directAsset.type, '(should be "video")');
      console.log('   - targetLetter:', directAsset.metadata?.targetLetter, `(query looking for "${targetLetter}" or null)`);
      console.log('   - child_name:', directAsset.metadata?.child_name, `(query looking for "${childName}" or null)`);
    }
  }
}

testHappyDanceQuery().catch(console.error);
