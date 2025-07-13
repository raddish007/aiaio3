const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateHappyDance() {
  console.log('🕵️ Happy Dance Investigation');
  console.log('============================');
  
  console.log('\n1. Checking Happy Dance Audio Assets:');
  const { data: happyDanceAudio, error: audioError } = await supabase
    .from('approved_assets')
    .select('*')
    .eq('assetPurpose', 'happyDanceAudio');
    
  console.log('   Total happyDanceAudio assets:', happyDanceAudio?.length || 0);
  if (happyDanceAudio?.length > 0) {
    console.log('   Sample happyDanceAudio asset:');
    console.log('   -', JSON.stringify(happyDanceAudio[0], null, 2));
  } else {
    console.log('   ❌ No happyDanceAudio assets found!');
  }
  
  console.log('\n2. Checking Happy Dance Video Assets:');
  const { data: happyDanceVideo, error: videoError } = await supabase
    .from('approved_assets')
    .select('*')
    .eq('assetPurpose', 'happyDanceVideo');
    
  console.log('   Total happyDanceVideo assets:', happyDanceVideo?.length || 0);
  if (happyDanceVideo?.length > 0) {
    console.log('   Sample happyDanceVideo asset:');
    console.log('   -', JSON.stringify(happyDanceVideo[0], null, 2));
  } else {
    console.log('   ❌ No happyDanceVideo assets found!');
  }
  
  console.log('\n3. Checking by videoType = "happyDance":');
  const { data: videoTypeAssets, error: vtError } = await supabase
    .from('approved_assets')
    .select('*')
    .eq('videoType', 'happyDance');
    
  console.log('   Total videoType="happyDance" assets:', videoTypeAssets?.length || 0);
  if (videoTypeAssets?.length > 0) {
    console.log('   Sample videoType happyDance asset:');
    console.log('   -', JSON.stringify(videoTypeAssets[0], null, 2));
  }
  
  console.log('\n4. Checking theme-specific assets for halloween:');
  const { data: themeAssets, error: themeError } = await supabase
    .from('approved_assets')
    .select('*')
    .eq('theme', 'halloween')
    .in('assetPurpose', ['happyDanceVideo', 'happyDanceAudio'])
    .order('created_at', { ascending: false });
    
  console.log('   Halloween theme happy dance assets:', themeAssets?.length || 0);
  themeAssets?.forEach((asset, index) => {
    console.log(`   ${index + 1}. ${asset.assetPurpose} - ${asset.file_url}`);
  });
  
  console.log('\n5. Checking letter-specific happy dance audio for letter A:');
  const { data: letterAssets, error: letterError } = await supabase
    .from('approved_assets')
    .select('*')
    .eq('targetLetter', 'A')
    .eq('assetPurpose', 'happyDanceAudio')
    .order('created_at', { ascending: false });
    
  console.log('   Letter A happy dance audio:', letterAssets?.length || 0);
  letterAssets?.forEach((asset, index) => {
    console.log(`   ${index + 1}. ${asset.assetPurpose} - ${asset.file_url}`);
  });
}

investigateHappyDance().catch(console.error);
