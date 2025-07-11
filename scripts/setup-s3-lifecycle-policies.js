#!/usr/bin/env node

/**
 * Script to set up S3 lifecycle policies for video retention and cost optimization
 * This script will:
 * - Create S3 buckets if they don't exist
 * - Set up lifecycle policies for automatic deletion of old videos
 * - Configure storage classes for cost optimization
 */

require('dotenv').config({ path: '.env.local' });
const { S3Client, CreateBucketCommand, PutBucketLifecycleConfigurationCommand, HeadBucketCommand, GetBucketLocationCommand } = require('@aws-sdk/client-s3');

// Environment Configuration
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const videoBucket = process.env.AWS_S3_VIDEO_BUCKET || 'aiaio-videos';
const assetBucket = process.env.AWS_S3_ASSET_BUCKET || 'aiaio-assets';

console.log('🔧 Setting up S3 lifecycle policies...');
console.log(`📋 Region: ${awsRegion}`);
console.log(`🎬 Video Bucket: ${videoBucket}`);
console.log(`🖼️ Asset Bucket: ${assetBucket}`);

// Create S3 client
const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Check if bucket exists
async function bucketExists(bucketName) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

// Create bucket if it doesn't exist
async function createBucket(bucketName) {
  try {
    const exists = await bucketExists(bucketName);
    if (exists) {
      console.log(`✅ Bucket '${bucketName}' already exists`);
      return;
    }

    console.log(`🔨 Creating bucket '${bucketName}'...`);
    const createCommand = new CreateBucketCommand({
      Bucket: bucketName,
      CreateBucketConfiguration: awsRegion !== 'us-east-1' ? {
        LocationConstraint: awsRegion
      } : undefined
    });

    await s3Client.send(createCommand);
    console.log(`✅ Created bucket '${bucketName}'`);
  } catch (error) {
    console.error(`❌ Error creating bucket '${bucketName}':`, error.message);
    throw error;
  }
}

// Set up lifecycle policy for video bucket (NO DELETION - only cost optimization)
async function setupVideoLifecyclePolicy(bucketName) {
  console.log(`⏰ Setting up lifecycle policy for video bucket '${bucketName}'...`);
  
  const lifecycleConfiguration = {
    Rules: [
      {
        ID: 'TransitionToIA',
        Status: 'Enabled',
        Filter: {
          Prefix: 'videos/'
        },
        Transitions: [
          {
            Days: 30,
            StorageClass: 'STANDARD_IA' // Move to Infrequent Access after 30 days
          },
          {
            Days: 90,
            StorageClass: 'GLACIER' // Archive to Glacier after 90 days
          }
        ]
      },
      {
        ID: 'DeleteIncompleteMultipartUploads',
        Status: 'Enabled',
        Filter: {},
        AbortIncompleteMultipartUpload: {
          DaysAfterInitiation: 7
        }
      }
    ]
  };

  try {
    await s3Client.send(new PutBucketLifecycleConfigurationCommand({
      Bucket: bucketName,
      LifecycleConfiguration: lifecycleConfiguration
    }));
    console.log(`✅ Lifecycle policy set for '${bucketName}':`);
    console.log(`   📦 Move to Infrequent Access after 30 days (50% cost savings)`);
    console.log(`   🧊 Archive to Glacier after 90 days (83% cost savings)`);
    console.log(`   🧹 Clean up incomplete uploads after 7 days`);
    console.log(`   ⚠️  NO AUTOMATIC DELETION - videos preserved indefinitely`);
  } catch (error) {
    console.error(`❌ Error setting lifecycle policy for '${bucketName}':`, error.message);
    throw error;
  }
}

// Set up lifecycle policy for asset bucket (longer retention)
async function setupAssetLifecyclePolicy(bucketName) {
  console.log(`⏰ Setting up lifecycle policy for asset bucket '${bucketName}'...`);
  
  const lifecycleConfiguration = {
    Rules: [
      {
        ID: 'TransitionAssetsToIA',
        Status: 'Enabled',
        Filter: {},
        Transitions: [
          {
            Days: 90,
            StorageClass: 'STANDARD_IA' // Move to Infrequent Access after 90 days
          },
          {
            Days: 180,
            StorageClass: 'GLACIER' // Archive to Glacier after 180 days
          }
        ]
      },
      {
        ID: 'DeleteOldTempAssets',
        Status: 'Enabled',
        Filter: {
          Prefix: 'temp/'
        },
        Expiration: {
          Days: 30 // Delete temporary assets after 30 days
        }
      },
      {
        ID: 'DeleteIncompleteMultipartUploads',
        Status: 'Enabled',
        Filter: {},
        AbortIncompleteMultipartUpload: {
          DaysAfterInitiation: 7
        }
      }
    ]
  };

  try {
    await s3Client.send(new PutBucketLifecycleConfigurationCommand({
      Bucket: bucketName,
      LifecycleConfiguration: lifecycleConfiguration
    }));
    console.log(`✅ Lifecycle policy set for '${bucketName}':`);
    console.log(`   📦 Move to Infrequent Access after 90 days`);
    console.log(`   🧊 Archive to Glacier after 180 days`);
    console.log(`   🗑️ Delete temp files after 30 days`);
    console.log(`   🧹 Clean up incomplete uploads after 7 days`);
  } catch (error) {
    console.error(`❌ Error setting lifecycle policy for '${bucketName}':`, error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log('\n🚀 Starting S3 setup...\n');

    // Check AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('❌ AWS credentials not found in environment variables');
      console.log('💡 Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file');
      process.exit(1);
    }

    // Create buckets
    await createBucket(videoBucket);
    await createBucket(assetBucket);

    console.log('\n⏰ Setting up lifecycle policies...\n');

    // Set up lifecycle policies
    await setupVideoLifecyclePolicy(videoBucket);
    await setupAssetLifecyclePolicy(assetBucket);

    console.log('\n✨ S3 setup complete!\n');
    console.log('📋 Summary:');
    console.log(`   🎬 Video bucket: ${videoBucket}`);
    console.log(`      - ✅ Videos preserved indefinitely (NO automatic deletion)`);
    console.log(`      - 💰 Cost optimization: Standard → IA (30d) → Glacier (90d)`);
    console.log(`   🖼️ Asset bucket: ${assetBucket}`);
    console.log(`      - Long-term storage with cost optimization`);
    console.log(`      - Temp files deleted after 30 days`);
    console.log('\n�️ Videos are preserved permanently. Use admin interface for manual management.');
    console.log('💰 Lifecycle policies reduce storage costs while maintaining all content.');

  } catch (error) {
    console.error('❌ S3 setup failed:', error.message);
    process.exit(1);
  }
}

async function showCurrentRetention() {
  console.log('\n📊 Current Video Retention Settings:');
  console.log('   🎬 Remotion videos: Stored in S3 indefinitely');
  console.log('   📱 Generated videos: Stored indefinitely');
  console.log('   💾 Database records: Permanent (contains metadata and URLs)');
  console.log('   🛡️ Manual deletion only via admin interface');
  console.log('\n💰 Lifecycle policies will optimize costs without deleting content.');
}

if (require.main === module) {
  showCurrentRetention();
  main().catch(console.error);
}

module.exports = { main, setupVideoLifecyclePolicy, setupAssetLifecyclePolicy };
