const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixHappyDanceTheme() {
  console.log('🔧 Fixing Happy Dance Asset Theme');
  console.log('=================================');
  
  const happyDanceAssetId = '0dddacc9-b2e1-4d87-9c36-7ffbe121f4fa';
  
  console.log('\n1. Current asset state:');
  const { data: currentAsset, error: fetchError } = await supabase
    .from('assets')
    .select('*')
    .eq('id', happyDanceAssetId)
    .single();
    
  if (!currentAsset) {
    console.log('❌ Asset not found:', fetchError);
    return;
  }
  
  console.log('   Current theme:', currentAsset.theme);
  console.log('   Current metadata.theme:', currentAsset.metadata?.theme);
  
  console.log('\n2. Updating asset theme to "halloween":');
  
  // Update both the theme field and metadata.theme
  const updatedMetadata = {
    ...currentAsset.metadata,
    theme: 'halloween'
  };
  
  const { data: updatedAsset, error: updateError } = await supabase
    .from('assets')
    .update({
      theme: 'halloween',
      metadata: updatedMetadata
    })
    .eq('id', happyDanceAssetId)
    .select()
    .single();
    
  if (updateError) {
    console.log('❌ Update failed:', updateError);
    return;
  }
  
  console.log('✅ Asset updated successfully!');
  console.log('   New theme:', updatedAsset.theme);
  console.log('   New metadata.theme:', updatedAsset.metadata?.theme);
  
  console.log('\n3. Verification:');
  console.log('   Theme now matches "halloween":', updatedAsset.theme === 'halloween');
  console.log('   Metadata theme matches:', updatedAsset.metadata?.theme === 'halloween');
  
  console.log('\n4. Testing theme normalization:');
  const normalizeTheme = (theme) => {
    const normalized = theme.toLowerCase();
    if (normalized === 'dogs' || normalized === 'dog') return 'dog';
    if (normalized === 'dinosaurs' || normalized === 'dinosaur') return 'dinosaur';
    if (normalized === 'cats' || normalized === 'cat') return 'cat';
    if (normalized === 'adventures' || normalized === 'adventure') return 'adventure';
    return normalized;
  };
  
  const normalizedAssetTheme = normalizeTheme(updatedAsset.metadata?.theme || '');
  const normalizedDesiredTheme = normalizeTheme('halloween');
  
  console.log('   Normalized asset theme:', normalizedAssetTheme);
  console.log('   Normalized desired theme:', normalizedDesiredTheme);
  console.log('   Themes match after normalization:', normalizedAssetTheme === normalizedDesiredTheme);
  
  if (normalizedAssetTheme === normalizedDesiredTheme) {
    console.log('\n🎉 Happy Dance asset should now work in videos with halloween theme!');
  } else {
    console.log('\n⚠️  Theme match still failing - may need additional normalization rules');
  }
}

fixHappyDanceTheme().catch(console.error);
