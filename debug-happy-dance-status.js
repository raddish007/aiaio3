const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://etshvxrgbssginmzsczo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0c2h2eHJnYnNzZ2lubXpzY3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkyMDc3NywiZXhwIjoyMDY3NDk2Nzc3fQ.BthIB5-UciZn7fjP5Hy1fqrRzan1BQIECuhudvVbEmI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugHappyDanceAssetStatus() {
  console.log('🐛 Debug Happy Dance Asset Status');
  console.log('=================================');
  
  const happyDanceAssetId = '0dddacc9-b2e1-4d87-9c36-7ffbe121f4fa';
  
  // 1. Get the actual asset
  const { data: asset, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', happyDanceAssetId)
    .single();
    
  if (!asset) {
    console.log('❌ Asset not found');
    return;
  }
  
  console.log('\n1. Raw Asset Data:');
  console.log('   ID:', asset.id);
  console.log('   Status:', asset.status);
  console.log('   File URL:', asset.file_url);
  console.log('   Type:', asset.type);
  console.log('   Theme:', asset.theme);
  
  console.log('\n2. Asset Metadata:');
  console.log(JSON.stringify(asset.metadata, null, 2));
  
  // 2. Simulate the asset status object that gets created in the UI
  console.log('\n3. Simulated Asset Status Object (what gets passed to Remotion):');
  
  const assetStatusObject = {
    id: asset.id,
    name: asset.title || `Happy Dance Video (${asset.theme})`,
    status: asset.status === 'approved' ? 'ready' : asset.status,
    url: asset.file_url,
    type: asset.type,
    videoType: asset.metadata?.videoType,
    theme: asset.theme
  };
  
  console.log(JSON.stringify(assetStatusObject, null, 2));
  
  console.log('\n4. Remotion Condition Check:');
  console.log('   assets.happyDanceVideo.status === "ready":', assetStatusObject.status === 'ready');
  console.log('   assets.happyDanceVideo.url exists:', !!assetStatusObject.url);
  
  if (assetStatusObject.status === 'ready' && assetStatusObject.url) {
    console.log('   ✅ Should render in Remotion composition');
  } else {
    console.log('   ❌ Will NOT render in Remotion composition');
    console.log('   Issue: status =', assetStatusObject.status, ', url =', !!assetStatusObject.url);
  }
  
  console.log('\n5. Theme Matching Check:');
  console.log('   Asset theme:', asset.theme);
  console.log('   Expected childTheme: halloween (based on previous tests)');
  console.log('   Theme matches:', asset.theme === 'halloween');
  
  if (asset.theme !== 'halloween') {
    console.log('   ⚠️  Theme mismatch detected!');
    console.log('   This might be why the UI shows a match but the video doesn\'t use it');
    console.log('   Solution: Update asset theme to "halloween" or create a halloween-themed happy dance asset');
  }
  
  console.log('\n6. URL Accessibility Test:');
  try {
    const response = await fetch(asset.file_url, { method: 'HEAD' });
    console.log('   URL HTTP Status:', response.status);
    if (response.ok) {
      console.log('   ✅ URL is accessible');
    } else {
      console.log('   ❌ URL is not accessible');
    }
  } catch (error) {
    console.log('   ❌ URL fetch failed:', error.message);
  }
}

debugHappyDanceAssetStatus().catch(console.error);
