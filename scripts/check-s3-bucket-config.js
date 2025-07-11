#!/usr/bin/env node

/**
 * Check S3 Bucket Configuration
 * 
 * This script checks the current S3 bucket configuration, including:
 * - Bucket existence and accessibility
 * - Lifecycle policies (for automatic deletion/retention)
 * - Storage classes
 * - Current storage usage
 * - Sample files and their ages
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, HeadBucketCommand, GetBucketLifecycleConfigurationCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

const awsRegion = process.env.AWS_REGION || 'us-east-1';
const videoBucket = process.env.AWS_S3_VIDEO_BUCKET || 'aiaio-videos';
const assetBucket = process.env.AWS_S3_ASSET_BUCKET || 'aiaio-assets';

const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function checkBucketExists(bucketName) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    return true;
  } catch (error) {
    console.log(`   ❌ Bucket '${bucketName}' not accessible: ${error.message}`);
    return false;
  }
}

async function checkLifecyclePolicies(bucketName) {
  try {
    const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
    const response = await s3Client.send(command);
    
    if (response.Rules && response.Rules.length > 0) {
      console.log(`   📋 Lifecycle Rules for ${bucketName}:`);
      response.Rules.forEach((rule, index) => {
        console.log(`      Rule ${index + 1}: ${rule.ID || 'Unnamed'}`);
        console.log(`         Status: ${rule.Status}`);
        if (rule.Filter) {
          console.log(`         Filter: ${JSON.stringify(rule.Filter)}`);
        }
        if (rule.Expiration) {
          console.log(`         Expiration: ${rule.Expiration.Days ? rule.Expiration.Days + ' days' : 'Date-based'}`);
        }
        if (rule.Transitions) {
          rule.Transitions.forEach(transition => {
            console.log(`         Transition: ${transition.Days} days → ${transition.StorageClass}`);
          });
        }
      });
    } else {
      console.log(`   ⏰ No lifecycle policies configured for ${bucketName}`);
    }
  } catch (error) {
    if (error.name === 'NoSuchLifecycleConfiguration') {
      console.log(`   ⏰ No lifecycle policies configured for ${bucketName}`);
    } else {
      console.log(`   ❌ Error checking lifecycle policies: ${error.message}`);
    }
  }
}

async function checkBucketContents(bucketName, maxKeys = 10) {
  try {
    const command = new ListObjectsV2Command({ 
      Bucket: bucketName, 
      MaxKeys: maxKeys 
    });
    const response = await s3Client.send(command);
    
    if (response.Contents && response.Contents.length > 0) {
      console.log(`   📁 Sample files in ${bucketName} (showing ${Math.min(maxKeys, response.Contents.length)} of ${response.KeyCount}):`);
      
      const now = new Date();
      response.Contents.forEach(obj => {
        const ageInDays = Math.floor((now - new Date(obj.LastModified)) / (1000 * 60 * 60 * 24));
        const sizeInMB = (obj.Size / (1024 * 1024)).toFixed(2);
        console.log(`      📄 ${obj.Key}`);
        console.log(`         Size: ${sizeInMB} MB | Age: ${ageInDays} days | Modified: ${obj.LastModified.toISOString()}`);
      });
      
      if (response.IsTruncated) {
        console.log(`      ... and ${response.KeyCount - maxKeys} more files`);
      }
    } else {
      console.log(`   📁 Bucket ${bucketName} is empty`);
    }
  } catch (error) {
    console.log(`   ❌ Error listing bucket contents: ${error.message}`);
  }
}

async function estimateBucketSize(bucketName) {
  try {
    let totalSize = 0;
    let objectCount = 0;
    let continuationToken;
    
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken
      });
      const response = await s3Client.send(command);
      
      if (response.Contents) {
        response.Contents.forEach(obj => {
          totalSize += obj.Size;
          objectCount++;
        });
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    const sizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
    console.log(`   📊 Bucket size: ${sizeInGB} GB (${objectCount} objects)`);
    
    return { totalSize, objectCount };
  } catch (error) {
    console.log(`   ❌ Error calculating bucket size: ${error.message}`);
    return { totalSize: 0, objectCount: 0 };
  }
}

async function main() {
  console.log('🔍 Checking S3 Bucket Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log(`   AWS Region: ${awsRegion}`);
  console.log(`   Video Bucket: ${videoBucket}`);
  console.log(`   Asset Bucket: ${assetBucket}`);
  console.log(`   AWS Access Key: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}`);
  console.log(`   AWS Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}\n`);
  
  // Check Video Bucket
  console.log(`🎬 Checking Video Bucket: ${videoBucket}`);
  const videosBucketExists = await checkBucketExists(videoBucket);
  if (videosBucketExists) {
    console.log(`   ✅ Bucket '${videoBucket}' is accessible`);
    await checkLifecyclePolicies(videoBucket);
    await estimateBucketSize(videoBucket);
    await checkBucketContents(videoBucket, 5);
  }
  console.log('');
  
  // Check Asset Bucket
  console.log(`🖼️ Checking Asset Bucket: ${assetBucket}`);
  const assetsBucketExists = await checkBucketExists(assetBucket);
  if (assetsBucketExists) {
    console.log(`   ✅ Bucket '${assetBucket}' is accessible`);
    await checkLifecyclePolicies(assetBucket);
    await estimateBucketSize(assetBucket);
    await checkBucketContents(assetBucket, 5);
  }
  console.log('');
  
  // Recommendations
  console.log('💡 Recommendations:');
  
  if (videosBucketExists || assetsBucketExists) {
    console.log('   1. ⏰ Consider setting up lifecycle policies to automatically delete old files');
    console.log('   2. 💰 Move old files to cheaper storage classes (IA, Glacier) after 30 days');
    console.log('   3. 🗑️ Automatically delete temporary render files after 7-30 days');
    console.log('   4. 📊 Monitor storage costs in AWS CloudWatch');
    console.log('   5. 🔒 Ensure buckets have proper access policies');
  }
  
  if (!videosBucketExists && !assetsBucketExists) {
    console.log('   1. 🚀 Create S3 buckets for video and asset storage');
    console.log('   2. 🔧 Configure AWS credentials in environment variables');
    console.log('   3. 📋 Set up lifecycle policies for cost optimization');
  }
  
  console.log('\n✨ S3 configuration check complete!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
