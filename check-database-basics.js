const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseBasics() {
  console.log('📊 Database Basics Check');
  console.log('========================');
  
  console.log('\n1. Total approved_assets count:');
  const { count, error: countError } = await supabase
    .from('approved_assets')
    .select('*', { count: 'exact', head: true });
    
  console.log('   Total assets:', count);
  
  if (count > 0) {
    console.log('\n2. Sample assets (first 5):');
    const { data: sampleAssets, error: sampleError } = await supabase
      .from('approved_assets')
      .select('*')
      .limit(5);
      
    sampleAssets?.forEach((asset, index) => {
      console.log(`   ${index + 1}. File: ${asset.file_url}`);
      console.log(`      MediaType: ${asset.mediaType}, Purpose: ${asset.assetPurpose}`);
      console.log(`      Theme: ${asset.theme}, Letter: ${asset.targetLetter}`);
      console.log(`      VideoType: ${asset.videoType}, ImageType: ${asset.imageType}`);
      console.log('');
    });
    
    console.log('\n3. Assets by mediaType:');
    const { data: byMediaType, error: mtError } = await supabase
      .from('approved_assets')
      .select('mediaType')
      .not('mediaType', 'is', null);
      
    const mediaTypeCounts = {};
    byMediaType?.forEach(asset => {
      mediaTypeCounts[asset.mediaType] = (mediaTypeCounts[asset.mediaType] || 0) + 1;
    });
    console.log('   Media type distribution:', mediaTypeCounts);
    
    console.log('\n4. Assets by theme:');
    const { data: byTheme, error: themeError } = await supabase
      .from('approved_assets')
      .select('theme')
      .not('theme', 'is', null);
      
    const themeCounts = {};
    byTheme?.forEach(asset => {
      themeCounts[asset.theme] = (themeCounts[asset.theme] || 0) + 1;
    });
    console.log('   Theme distribution:', themeCounts);
  }
  
  console.log('\n5. Checking if we need to create Happy Dance assets:');
  console.log('   Since no Happy Dance assets exist, we need to either:');
  console.log('   a) Create new Happy Dance assets, or');
  console.log('   b) Update existing assets to have Happy Dance metadata');
}

checkDatabaseBasics().catch(console.error);
