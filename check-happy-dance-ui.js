require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHappyDanceUI() {
  console.log('🎯 Checking what Letter Hunt UI shows for Happy Dance...');
  
  const childName = 'Andrew';
  const targetLetter = 'A';
  const themeToUse = 'dogs';

  // Simulate exactly what the UI does
  const { data: specificAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('metadata->>child_name', childName)
    .eq('metadata->>targetLetter', targetLetter);

  const { data: letterSpecificAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('metadata->>targetLetter', targetLetter)
    .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

  const { data: letterSpecificAudioAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'audio')
    .eq('metadata->>targetLetter', targetLetter)
    .or('metadata->>child_name.is.null,metadata->>child_name.eq.');

  const { data: genericVideoAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'video')
    .or('metadata->>child_name.is.null,metadata->>child_name.eq.')
    .is('metadata->>targetLetter', null);

  const { data: genericAudioAssets } = await supabase
    .from('assets')
    .select('*')
    .in('status', ['approved', 'pending'])
    .eq('metadata->>template', 'letter-hunt')
    .eq('type', 'audio')
    .or('metadata->>child_name.is.null,metadata->>child_name.eq.')
    .is('metadata->>targetLetter', null);

  const existingAssets = [
    ...(specificAssets || []),
    ...(letterSpecificAssets || []),
    ...(letterSpecificAudioAssets || []),
    ...(genericVideoAssets || []),
    ...(genericAudioAssets || [])
  ];

  const existingByType = new Map();
  
  existingAssets.forEach(asset => {
    let assetKey = null;
    
    if (asset.type === 'video') {
      const section = asset.metadata?.section;
      const category = asset.metadata?.category;
      const videoType = asset.metadata?.videoType;
      
      if (section === 'happyDanceVideo' || section === 'dance' || videoType === 'happyDanceVideo' || category === 'dance') {
        assetKey = 'happyDanceVideo';
        
        const currentTheme = asset.metadata?.theme?.toLowerCase();
        const desiredTheme = themeToUse.toLowerCase();
        
        const normalizeTheme = (theme) => {
          const normalized = theme.toLowerCase();
          if (normalized === 'dogs' || normalized === 'dog') return 'dog';
          return normalized;
        };
        
        const normalizedCurrentTheme = normalizeTheme(currentTheme || '');
        const normalizedDesiredTheme = normalizeTheme(desiredTheme);
        
        if (normalizedCurrentTheme === normalizedDesiredTheme) {
          existingByType.set(assetKey, asset);
        }
      }
    } else if (asset.type === 'audio') {
      const assetPurpose = asset.metadata?.assetPurpose;
      
      if (assetPurpose === 'happyDanceAudio') {
        assetKey = 'happyDanceAudio';
        existingByType.set(assetKey, asset);
      }
    }
  });

  // Build asset status like the UI does
  const assetStatus = {
    happyDanceVideo: existingByType.get('happyDanceVideo') ? {
      ...existingByType.get('happyDanceVideo'),
      type: 'video',
      name: 'Happy Dance Video',
      description: `${themeToUse} character doing a joyful dance`
    } : {
      type: 'video',
      name: 'Happy Dance Video',
      description: `${themeToUse} character doing a joyful dance`,
      status: 'missing'
    },
    happyDanceAudio: existingByType.get('happyDanceAudio') ? {
      ...existingByType.get('happyDanceAudio'),
      type: 'audio',
      name: 'Happy Dance Audio',
      description: '"And when you find your letter, I want you to do a little happy dance!"'
    } : {
      type: 'audio',
      name: 'Happy Dance Audio',
      description: '"And when you find your letter, I want you to do a little happy dance!"',
      status: 'missing'
    }
  };

  console.log('\n🎯 UI Status for Happy Dance:');
  console.log(`\nVideo Status:`);
  console.log(`  Name: ${assetStatus.happyDanceVideo.name}`);
  console.log(`  Status: ${assetStatus.happyDanceVideo.status || 'found'}`);
  console.log(`  Description: ${assetStatus.happyDanceVideo.description}`);
  if (assetStatus.happyDanceVideo.id) {
    console.log(`  Asset ID: ${assetStatus.happyDanceVideo.id}`);
  }

  console.log(`\nAudio Status:`);
  console.log(`  Name: ${assetStatus.happyDanceAudio.name}`);
  console.log(`  Status: ${assetStatus.happyDanceAudio.status || 'found'}`);
  console.log(`  Description: ${assetStatus.happyDanceAudio.description}`);
  if (assetStatus.happyDanceAudio.id) {
    console.log(`  Asset ID: ${assetStatus.happyDanceAudio.id}`);
  }
}

checkHappyDanceUI().catch(console.error);
