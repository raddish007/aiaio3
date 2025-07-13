const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findPotentialHappyDanceAssets() {
  console.log('🔍 Finding Potential Happy Dance Assets');
  console.log('=====================================');
  
  console.log('\n1. All existing assetPurpose values:');
  const { data: purposes, error: purposeError } = await supabase
    .from('approved_assets')
    .select('assetPurpose')
    .not('assetPurpose', 'is', null);
    
  const uniquePurposes = [...new Set(purposes?.map(p => p.assetPurpose))];
  console.log('   Available assetPurpose values:');
  uniquePurposes.forEach(purpose => console.log('   -', purpose));
  
  console.log('\n2. Assets with "dance" in filename or description:');
  const { data: danceAssets, error: danceError } = await supabase
    .from('approved_assets')
    .select('*')
    .or('file_url.ilike.%dance%,description.ilike.%dance%,prompt.ilike.%dance%');
    
  console.log('   Assets with "dance" keyword:', danceAssets?.length || 0);
  danceAssets?.forEach(asset => {
    console.log(`   - ${asset.file_url} (${asset.assetPurpose || 'no purpose'})`);
  });
  
  console.log('\n3. Video assets that might be Happy Dance:');
  const { data: videoAssets, error: videoError } = await supabase
    .from('approved_assets')
    .select('*')
    .eq('mediaType', 'video')
    .eq('theme', 'halloween')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log('   Recent halloween video assets:', videoAssets?.length || 0);
  videoAssets?.forEach(asset => {
    console.log(`   - ${asset.file_url}`);
    console.log(`     Purpose: ${asset.assetPurpose || 'none'}, VideoType: ${asset.videoType || 'none'}`);
  });
  
  console.log('\n4. Audio assets that might be Happy Dance:');
  const { data: audioAssets, error: audioError } = await supabase
    .from('approved_assets')
    .select('*')
    .eq('mediaType', 'audio')
    .eq('targetLetter', 'A')
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log('   Recent letter A audio assets:', audioAssets?.length || 0);
  audioAssets?.forEach(asset => {
    console.log(`   - ${asset.file_url}`);
    console.log(`     Purpose: ${asset.assetPurpose || 'none'}, Description: ${asset.description || 'none'}`);
  });
  
  console.log('\n5. All videoType values:');
  const { data: videoTypes, error: vtError } = await supabase
    .from('approved_assets')
    .select('videoType')
    .not('videoType', 'is', null);
    
  const uniqueVideoTypes = [...new Set(videoTypes?.map(v => v.videoType))];
  console.log('   Available videoType values:');
  uniqueVideoTypes.forEach(vt => console.log('   -', vt));
}

findPotentialHappyDanceAssets().catch(console.error);
