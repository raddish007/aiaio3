#!/usr/bin/env node

// Debug script to test S3 video listing
const { S3VideoManager } = require('./lib/s3-video-manager');

async function debugS3VideoListing() {
  try {
    console.log('Testing S3 Video Manager...');
    
    // Test connection and list videos
    console.log('\n1. Testing listVideos with default prefix:');
    const allVideos = await S3VideoManager.listVideos();
    console.log(`Found ${allVideos.length} videos with default prefix`);
    console.log('Sample videos:', allVideos.slice(0, 3).map(v => ({ key: v.key, size: v.size })));
    
    // Test with videos/ prefix specifically
    console.log('\n2. Testing listVideos with "videos/" prefix:');
    const videosWithPrefix = await S3VideoManager.listVideos('videos/');
    console.log(`Found ${videosWithPrefix.length} videos with "videos/" prefix`);
    console.log('Sample videos:', videosWithPrefix.slice(0, 3).map(v => ({ key: v.key, size: v.size })));
    
    // Test with empty prefix to see all objects
    console.log('\n3. Testing listVideos with empty prefix:');
    const allObjects = await S3VideoManager.listVideos('', 1000);
    console.log(`Found ${allObjects.length} videos with empty prefix`);
    console.log('Sample videos:', allObjects.slice(0, 5).map(v => ({ key: v.key, size: v.size })));
    
    // Test storage stats
    console.log('\n4. Testing getStorageStats:');
    const stats = await S3VideoManager.getStorageStats();
    console.log('Storage stats:', {
      totalObjects: stats.totalObjects,
      totalSize: stats.totalSize,
      storageBreakdown: stats.storageBreakdown
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
}

debugS3VideoListing();
