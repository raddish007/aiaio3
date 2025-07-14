#!/usr/bin/env node

// Test the video approval copy function directly
require('dotenv').config({ path: '.env.local' });

const { copyRemotionVideoToPublicBucket } = require('./lib/video-approval');

async function testVideoApprovalCopy() {
  try {
    console.log('🧪 Testing video approval copy function...\n');
    
    // Test URL from the S3 debug - we found this file exists
    const testOriginalUrl = 'https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/04hhuyoiup/out.mp4';
    const testVideoId = 'test-video-123';
    const testChildName = 'TestChild';
    
    console.log('📝 Test parameters:');
    console.log('   Original URL:', testOriginalUrl);
    console.log('   Video ID:', testVideoId);
    console.log('   Child Name:', testChildName);
    console.log();
    
    console.log('🔄 Attempting to copy video...');
    const result = await copyRemotionVideoToPublicBucket(testOriginalUrl, testVideoId, testChildName);
    
    console.log('✅ Copy successful!');
    console.log('📤 New public URL:', result);
    
  } catch (error) {
    console.error('❌ Copy failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code || 'N/A',
      statusCode: error.$metadata?.httpStatusCode || 'N/A'
    });
  }
}

testVideoApprovalCopy();
