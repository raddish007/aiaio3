// Test the matching logic used in the API
function testMatchingLogic() {
  console.log('🔍 Testing matching logic...\n');

  // Simulate the videoLookup map
  const videoLookup = new Map();
  
  // Add a test entry (simulating database data)
  const dbKey = 'approved-videos/2025/07/13/47540d2d-8b17-4339-8d45-5d5b8a4199d0-Andrew-out.mp4';
  const dbVideoData = {
    video_title: 'Letter Hunt for Andrew - Letter A',
    id: '47540d2d-8b17-4339-8d45-5d5b8a4199d0',
    source: 'child_approved_videos'
  };
  
  videoLookup.set(dbKey, dbVideoData);
  
  // Also add UUID-based lookup
  const uuid = '47540d2d-8b17-4339-8d45-5d5b8a4199d0';
  videoLookup.set(uuid, dbVideoData);
  
  console.log(`📊 Video lookup map has ${videoLookup.size} entries`);
  console.log('🔍 Keys in videoLookup:');
  videoLookup.forEach((video, key) => {
    console.log(`   "${key}" -> ${video.video_title}`);
  });
  
  // Test S3 object (simulating S3 data)
  const s3Key = 'approved-videos/2025/07/13/47540d2d-8b17-4339-8d45-5d5b8a4199d0-Andrew-out.mp4';
  
  console.log(`\n🔍 Testing matching for S3 key: ${s3Key}`);
  
  // Try exact key match first
  let dbVideo = videoLookup.get(s3Key);
  console.log(`   Exact match: ${!!dbVideo}`);
  if (dbVideo) {
    console.log(`   Matched video: ${dbVideo.video_title}`);
  }
  
  // If no exact match, try matching by UUID in the key
  if (!dbVideo) {
    const uuidMatch = s3Key.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    if (uuidMatch) {
      console.log(`   Trying UUID match: ${uuidMatch[0]}`);
      dbVideo = videoLookup.get(uuidMatch[0]);
      console.log(`   UUID match: ${!!dbVideo}`);
      if (dbVideo) {
        console.log(`   Matched video: ${dbVideo.video_title}`);
      }
    }
  }
  
  console.log('\n✅ Test completed!');
}

testMatchingLogic(); 