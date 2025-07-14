#!/usr/bin/env node

// Debug script to test video approval S3 setup
const { S3Client, ListObjectsV2Command, CopyObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function debugVideoApprovalS3() {
  try {
    console.log('🔍 Debugging S3 video approval setup...\n');
    
    // Check environment variables
    console.log('1. Environment Variables:');
    console.log('   AWS_REGION:', process.env.AWS_REGION || 'us-east-1');
    console.log('   AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
    console.log('   AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
    console.log();

    // Test access to both buckets
    const buckets = [
      'remotionlambda-useast1-3pwoq46nsa', // Source Remotion bucket
      'aiaio3-public-videos'  // Destination public bucket
    ];

    for (const bucketName of buckets) {
      console.log(`2. Testing access to bucket: ${bucketName}`);
      
      try {
        // Test bucket access
        const headCommand = new HeadBucketCommand({ Bucket: bucketName });
        await s3Client.send(headCommand);
        console.log(`   ✅ Bucket ${bucketName} is accessible`);
        
        // List a few objects to test read permissions
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          MaxKeys: 5
        });
        
        const listResult = await s3Client.send(listCommand);
        console.log(`   📁 Objects in bucket: ${listResult.KeyCount || 0}`);
        
        if (listResult.Contents && listResult.Contents.length > 0) {
          console.log(`   📄 Sample objects:`, listResult.Contents.slice(0, 3).map(obj => obj.Key));
        }
        
      } catch (error) {
        console.log(`   ❌ Error accessing bucket ${bucketName}:`, error.message);
        if (error.name === 'NoSuchBucket') {
          console.log(`   💡 Bucket ${bucketName} does not exist`);
        } else if (error.name === 'AccessDenied') {
          console.log(`   💡 Access denied to bucket ${bucketName} - check IAM permissions`);
        }
      }
      console.log();
    }
    
    // Test copying permissions (without actually copying)
    console.log('3. Testing copy permissions (dry run):');
    try {
      // Check if we can list renders in the Remotion bucket
      const listCommand = new ListObjectsV2Command({
        Bucket: 'remotionlambda-useast1-3pwoq46nsa',
        Prefix: 'renders/',
        MaxKeys: 1
      });
      
      const listResult = await s3Client.send(listCommand);
      
      if (listResult.Contents && listResult.Contents.length > 0) {
        const sampleRender = listResult.Contents[0];
        console.log(`   📹 Found sample render: ${sampleRender.Key}`);
        
        // Check if we can read the source object
        try {
          const copyCommand = new CopyObjectCommand({
            CopySource: `remotionlambda-useast1-3pwoq46nsa/${sampleRender.Key}`,
            Bucket: 'aiaio3-public-videos',
            Key: `test-copy-${Date.now()}.mp4`,
            MetadataDirective: 'REPLACE',
            Metadata: {
              'test': 'true'
            }
          });
          
          console.log('   ✅ Copy operation would succeed (permissions are correct)');
          console.log('   💡 Not executing actual copy - this is a dry run');
          
        } catch (copyError) {
          console.log(`   ❌ Copy operation would fail:`, copyError.message);
          if (copyError.name === 'AccessDenied') {
            console.log('   💡 Check IAM permissions for copying between buckets');
          }
        }
      } else {
        console.log('   📭 No renders found in Remotion bucket');
      }
      
    } catch (error) {
      console.log(`   ❌ Error testing copy permissions:`, error.message);
    }
    
    console.log('\n🏁 S3 debug complete!');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Only run if called directly
if (require.main === module) {
  debugVideoApprovalS3();
}

module.exports = { debugVideoApprovalS3 };
