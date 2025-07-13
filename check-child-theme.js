const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkChildAndTheme() {
  console.log('🔍 Checking Child and Theme Setup');
  console.log('=================================');
  
  console.log('\n1. Looking for children in the database:');
  const { data: children, error: childError } = await supabase
    .from('children')
    .select('*')
    .limit(10);
    
  if (children && children.length > 0) {
    console.log(`   Found ${children.length} children:`);
    children.forEach((child, index) => {
      console.log(`   ${index + 1}. Name: ${child.name}, Theme: ${child.primary_interest}, ID: ${child.id}`);
    });
    
    // Check if Andrew exists
    const andrew = children.find(child => child.name === 'Andrew');
    if (andrew) {
      console.log(`\n   ✅ Andrew found! Theme: ${andrew.primary_interest}`);
      
      // Test theme matching
      const assetTheme = 'Dog';
      const childTheme = andrew.primary_interest;
      
      console.log('\n2. Theme Matching Test:');
      console.log('   Asset theme:', assetTheme);
      console.log('   Child theme:', childTheme);
      console.log('   Direct match:', assetTheme === childTheme);
      
      // Test normalization
      const normalizeTheme = (theme) => {
        const normalized = theme.toLowerCase();
        if (normalized === 'dogs' || normalized === 'dog') return 'dog';
        if (normalized === 'dinosaurs' || normalized === 'dinosaur') return 'dinosaur';
        if (normalized === 'cats' || normalized === 'cat') return 'cat';
        if (normalized === 'adventures' || normalized === 'adventure') return 'adventure';
        return normalized;
      };
      
      const normalizedAssetTheme = normalizeTheme(assetTheme);
      const normalizedChildTheme = normalizeTheme(childTheme);
      
      console.log('   Normalized asset theme:', normalizedAssetTheme);
      console.log('   Normalized child theme:', normalizedChildTheme);
      console.log('   Normalized match:', normalizedAssetTheme === normalizedChildTheme);
      
      if (normalizedAssetTheme === normalizedChildTheme) {
        console.log('   ✅ Themes should match! Happy Dance should work.');
      } else {
        console.log('   ❌ Theme mismatch - this is why Happy Dance isn\'t working');
        console.log('   🔧 Need to either:');
        console.log(`      a) Change child's theme to "Dog"`);
        console.log(`      b) Create a Happy Dance asset with theme "${childTheme}"`);
        console.log(`      c) Make theme matching more flexible`);
      }
    } else {
      console.log('\n   ❌ Andrew not found in children database');
      console.log('   This might be why the theme doesn\'t match');
    }
    
  } else {
    console.log('   ❌ No children found in database');
  }
  
  console.log('\n3. Checking what themes exist for Happy Dance assets:');
  const { data: happyDanceAssets, error: hdError } = await supabase
    .from('assets')
    .select('theme, metadata')
    .eq('type', 'video')
    .eq('metadata->>videoType', 'happyDanceVideo');
    
  if (happyDanceAssets && happyDanceAssets.length > 0) {
    console.log('   Available Happy Dance video themes:');
    happyDanceAssets.forEach((asset, index) => {
      console.log(`   ${index + 1}. Theme: ${asset.theme}, Metadata theme: ${asset.metadata?.theme}`);
    });
  } else {
    console.log('   ❌ No Happy Dance video assets found');
  }
  
  console.log('\n4. Alternative investigation - manual theme test:');
  console.log('   If you tell me what child theme you\'re actually using,');
  console.log('   I can check if that matches the "Dog" asset theme.');
}

checkChildAndTheme().catch(console.error);
