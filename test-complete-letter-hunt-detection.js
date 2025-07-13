require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAllLetterHuntImages() {
  console.log('🔍 Checking all Letter Hunt image assets...\n');
  
  const imageTypes = ['signImage', 'bookImage', 'groceryImage', 'endingImage', 'titleCard'];
  
  for (const imageType of imageTypes) {
    console.log(`📋 ${imageType} assets:`);
    
    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'image')
      .eq('metadata->>imageType', imageType)
      .eq('metadata->>template', 'letter-hunt')
      .in('status', ['approved', 'pending']);

    if (error) {
      console.error(`❌ Error fetching ${imageType} assets:`, error);
      continue;
    }

    console.log(`   Found ${assets?.length || 0} assets`);
    
    if (assets && assets.length > 0) {
      assets.forEach((asset, index) => {
        console.log(`   ${index + 1}. ${asset.status} - Letter ${asset.metadata?.targetLetter || 'N/A'} - Child: "${asset.metadata?.child_name || 'N/A'}" - ID: ${asset.id}`);
      });
    }
    console.log('');
  }

  // Test the complete Letter Hunt asset detection
  console.log('🧪 Testing complete Letter Hunt detection for Andrew + Letter A:\n');
  
  const childName = 'Andrew';
  const targetLetter = 'A';

  // 1. Child + letter specific assets
  const { data: specificAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('metadata->>child_name', childName)
    .eq('metadata->>targetLetter', targetLetter);

  // 2. Letter-specific image assets (updated query)
  const { data: letterSpecificImageAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'image')
    .eq('metadata->>targetLetter', targetLetter)
    .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

  // 3. Letter-specific audio assets
  const { data: letterSpecificAudioAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'audio')
    .eq('metadata->>targetLetter', targetLetter)
    .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

  // Combine all assets
  const allAssets = [
    ...(specificAssets || []),
    ...(letterSpecificImageAssets || []),
    ...(letterSpecificAudioAssets || [])
  ];

  console.log(`📦 Total assets found: ${allAssets.length}`);
  console.log(`   Specific (Andrew + A): ${specificAssets?.length || 0}`);
  console.log(`   Letter-specific images (A): ${letterSpecificImageAssets?.length || 0}`);
  console.log(`   Letter-specific audio (A): ${letterSpecificAudioAssets?.length || 0}`);

  // Map assets by type
  const existingByType = new Map();
  allAssets.forEach(asset => {
    const assetKey = asset.metadata?.imageType || asset.metadata?.assetPurpose || asset.metadata?.videoType;
    
    if (assetKey) {
      existingByType.set(assetKey, {
        url: asset.file_url,
        status: 'ready',
        assetId: asset.id,
        generatedAt: asset.created_at
      });
    }
  });

  console.log('\n🗂️ Mapped assets by type:');
  const expectedTypes = ['titleCard', 'signImage', 'bookImage', 'groceryImage', 'endingImage', 'titleAudio', 'introAudio'];
  
  expectedTypes.forEach(type => {
    if (existingByType.has(type)) {
      console.log(`   ✅ ${type}: Ready (${existingByType.get(type).assetId})`);
    } else {
      console.log(`   ❌ ${type}: Missing`);
    }
  });

  console.log('\n🎯 Letter Hunt workflow should now detect these assets and show them as ready!');
}

checkAllLetterHuntImages();
