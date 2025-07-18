// Quick test to check asset mapping in the UI
// Add this temporarily to the wish-button-request.tsx file
// After line where refreshAssetsFromDatabase is called

console.log('🔍 Debug Test: Current assets structure:');
console.log('assets.page2_audio:', assets?.page2_audio);
console.log('assets keys:', Object.keys(assets || {}));

// Check what happens when we try to map the specific asset
const testAsset = {
  id: '732fcd55-2901-462b-9712-97b27a82822c',
  type: 'audio',
  status: 'pending',
  metadata: {
    template: 'wish-button',
    asset_purpose: 'page2',
    page: 'page2'
  },
  file_url: 'some-url'
};

const assetPurpose = testAsset.metadata?.asset_purpose || testAsset.metadata?.page;
const assetType = testAsset.type;
const assetKey = `${assetPurpose}_${assetType}`;

console.log('🎯 Test mapping:');
console.log('Asset purpose:', assetPurpose);
console.log('Asset type:', assetType);
console.log('Asset key:', assetKey);
console.log('Does assets have this key?', assetKey in (assets || {}));
console.log('Assets[assetKey]:', assets?.[assetKey as keyof WishButtonAssets]);
