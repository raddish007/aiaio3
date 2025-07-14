#!/usr/bin/env node

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Test CloudFront distribution
const CLOUDFRONT_DOMAIN = 'd7lpoub47y3dp.cloudfront.net';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCloudFront() {
  console.log('🧪 Testing CloudFront Distribution');
  console.log('='.repeat(50));
  
  try {
    // Test basic CloudFront response
    console.log('1. Testing CloudFront domain accessibility...');
    const response = await fetch(`https://${CLOUDFRONT_DOMAIN}/`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
    
    // Get a sample video from database
    console.log('\n2. Finding sample video from database...');
    const { data: videos, error } = await supabase
      .from('child_approved_videos')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('   Error fetching videos:', error);
      return;
    }
    
    if (!videos || videos.length === 0) {
      console.log('   No videos found in database');
      return;
    }
    
    const video = videos[0];
    console.log(`   Found video: ${video.title || video.id}`);
    console.log(`   S3 URL: ${video.video_url}`);
    
    // Extract S3 key from URL
    const s3Key = video.video_url.split('.amazonaws.com/')[1];
    if (!s3Key) {
      console.log('   Could not extract S3 key from URL');
      return;
    }
    
    // Test CloudFront URL
    const cloudFrontUrl = `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;
    console.log(`   CloudFront URL: ${cloudFrontUrl}`);
    
    console.log('\n3. Testing video access through CloudFront...');
    const videoResponse = await fetch(cloudFrontUrl, { method: 'HEAD' });
    console.log(`   Status: ${videoResponse.status}`);
    console.log(`   Content-Type: ${videoResponse.headers.get('content-type')}`);
    console.log(`   Content-Length: ${videoResponse.headers.get('content-length')}`);
    console.log(`   Cache-Control: ${videoResponse.headers.get('cache-control')}`);
    console.log(`   CloudFront Headers:`);
    console.log(`     - Via: ${videoResponse.headers.get('via')}`);
    console.log(`     - X-Cache: ${videoResponse.headers.get('x-cache')}`);
    console.log(`     - X-Amz-Cf-Pop: ${videoResponse.headers.get('x-amz-cf-pop')}`);
    
    if (videoResponse.status === 200) {
      console.log('\n✅ SUCCESS: CloudFront is working correctly!');
      console.log('\n📋 Next Steps:');
      console.log('1. Your videos will now load faster globally');
      console.log('2. Update your application to use CloudFront URLs');
      console.log('3. Monitor performance in CloudWatch');
      console.log('4. Consider setting up custom domain if needed');
    } else {
      console.log('\n❌ ISSUE: Video not accessible through CloudFront');
      console.log('   Check S3 bucket policy and distribution configuration');
    }
    
  } catch (error) {
    console.error('Error testing CloudFront:', error);
  }
}

testCloudFront();
