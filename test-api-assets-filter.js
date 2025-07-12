#!/usr/bin/env node

// Test script to verify the API asset filtering is working correctly

// Simulate the original payload (what the frontend sends)
const originalPayload = {
  "childName": "Andrew",
  "targetLetter": "A",
  "childTheme": "dogs",
  "childAge": 1,
  "childId": "87109f4e-c10c-4400-a838-0cffad09b0a5",
  "submitted_by": "1cb80063-9b5f-4fff-84eb-309f12bd247d",
  "assets": {
    "titleCard": {
      "url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/images/fal.ai_imagen4_1752334773919_59l16mcyb.png",
      "status": "ready"
    },
    "signImage": {
      "url": "",
      "status": "missing"
    },
    "bookImage": {
      "url": "",
      "status": "missing"
    },
    "groceryImage": {
      "url": "",
      "status": "missing"
    },
    "endingImage": {
      "url": "",
      "status": "missing"
    },
    "introVideo": {
      "url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/video/video_1752351143430.mp4",
      "status": "ready"
    },
    "intro2Video": {
      "url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/video/video_1752351002616.mp4",
      "status": "ready"
    },
    "intro3Video": {
      "url": "",
      "status": "missing"
    },
    "happyDanceVideo": {
      "url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/video/video_1752357974090.mp4",
      "status": "ready"
    },
    "titleAudio": {
      "url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/elevenlabs_1752346832020_248nvfaZe8BXhKntjmpp.mp3",
      "status": "ready"
    },
    "introAudio": {
      "url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/elevenlabs_1752353625700_248nvfaZe8BXhKntjmpp.mp3",
      "status": "ready"
    },
    "intro2Audio": {
      "url": "",
      "status": "missing"
    },
    "intro3Audio": {
      "url": "",
      "status": "missing"
    },
    "signAudio": {
      "url": "",
      "status": "missing"
    },
    "bookAudio": {
      "url": "",
      "status": "missing"
    },
    "groceryAudio": {
      "url": "",
      "status": "missing"
    },
    "happyDanceAudio": {
      "url": "",
      "status": "missing"
    },
    "endingAudio": {
      "url": "",
      "status": "missing"
    },
    "backgroundMusic": {
      "url": "https://etshvxrgbssginmzsczo.supabase.co/storage/v1/object/public/assets/assets/audio/1752340926893.MP3",
      "status": "ready"
    }
  }
};

// Simulate the new API filtering logic
const requiredAssetKeys = [
  'titleCard', 'titleAudio',           // Part 1: Title (0-3s)
  'introVideo', 'introAudio',          // Part 2: Letter + Theme (3-6s)
  'intro2Video', 'intro2Audio',        // Part 3: Search (6-9s)  
  'backgroundMusic'                    // Background music throughout
];

const filteredAssets = {};
let readyAssetCount = 0;

console.log('🔍 Testing API Asset Filtering\n');

console.log('📦 Original payload assets:');
Object.keys(originalPayload.assets).forEach(key => {
  const asset = originalPayload.assets[key];
  console.log(`  ${key}: ${asset.status} ${asset.url ? '✓' : '✗'}`);
});

console.log('\n🎯 Required assets for 3-part render:');
console.log(`  ${requiredAssetKeys.join(', ')}`);

console.log('\n⚙️ Filtering assets...');

// Process and validate each asset (simulate API logic)
for (const key of requiredAssetKeys) {
  const asset = originalPayload.assets?.[key];
  if (asset && asset.url && asset.status === 'ready') {
    filteredAssets[key] = asset;
    readyAssetCount++;
    console.log(`  ✅ ${key}: included (${asset.status})`);
  } else {
    filteredAssets[key] = { 
      url: '', 
      status: 'missing'
    };
    console.log(`  ⚠️ ${key}: missing or not ready`);
  }
}

console.log('\n📊 Results:');
console.log(`  Total required: ${requiredAssetKeys.length}`);
console.log(`  Ready assets: ${readyAssetCount}`);
console.log(`  Completion: ${Math.round((readyAssetCount / requiredAssetKeys.length) * 100)}%`);

console.log('\n🚀 Assets that would be sent to Remotion:');
console.log(JSON.stringify(filteredAssets, null, 2));

console.log('\n🚫 Assets that would be EXCLUDED from Remotion:');
const excludedAssets = Object.keys(originalPayload.assets).filter(key => !requiredAssetKeys.includes(key));
excludedAssets.forEach(key => {
  const asset = originalPayload.assets[key];
  console.log(`  ${key}: ${asset.status} ${asset.url ? '(has URL)' : '(no URL)'}`);
});

console.log('\n✅ happyDanceVideo is properly excluded from render!');
