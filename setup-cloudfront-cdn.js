// Script to set up CloudFront CDN for video delivery
// This script will help you configure CloudFront distribution for your S3 bucket

const instructions = `
🚀 Setting up CloudFront CDN for Video Delivery

Follow these steps to create a CloudFront distribution for your S3 bucket:

## Step 1: Create CloudFront Distribution

1. Go to AWS CloudFront Console: https://console.aws.amazon.com/cloudfront/
2. Click "Create Distribution"
3. Configure the following settings:

### Origin Settings:
- Origin Domain: aiaio3-public-videos.s3.amazonaws.com
- Origin Path: (leave empty)
- Name: aiaio3-public-videos-origin
- Origin Access: Origin Access Control settings (recommended)
- Origin Access Control: Create new OAC
  - Name: aiaio3-public-videos-oac
  - Description: OAC for aiaio3 video bucket
  - Signing behavior: Sign requests

### Default Cache Behavior:
- Path Pattern: Default (*)
- Compress Objects Automatically: Yes
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
- Cache Policy: CachingOptimized (recommended for videos)
- Origin Request Policy: UserAgentRefererHeaders
- Response Headers Policy: SimpleCORS

### Settings:
- Price Class: Use All Edge Locations (best performance)
- Alternate Domain Names (CNAMEs): (optional - add your custom domain if you have one)
- SSL Certificate: Default CloudFront certificate
- Default Root Object: (leave empty)
- Enable Logging: No (for now)

## Step 2: Update S3 Bucket Policy

After creating the distribution, you'll need to update your S3 bucket policy to allow CloudFront access.

The CloudFront console will show you the exact policy to add. It will look like this:

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::aiaio3-public-videos/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
                }
            }
        }
    ]
}

## Step 3: Test the Distribution

Once deployed (takes 5-15 minutes), test with:
https://YOUR_DISTRIBUTION_DOMAIN.cloudfront.net/path/to/your/video.mp4

## Step 4: Update Environment Variables

Add these to your .env.local file:
CLOUDFRONT_DISTRIBUTION_DOMAIN=YOUR_DISTRIBUTION_DOMAIN.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=YOUR_DISTRIBUTION_ID

## Benefits:
✅ Faster video loading globally
✅ Reduced S3 bandwidth costs
✅ Better user experience
✅ Automatic HTTPS
✅ Compression and optimization
`;

console.log(instructions);

// Helper function to generate the bucket policy once you have the distribution
function generateBucketPolicy(distributionId, accountId) {
  return {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "AllowCloudFrontServicePrincipal",
        "Effect": "Allow",
        "Principal": {
          "Service": "cloudfront.amazonaws.com"
        },
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::aiaio3-public-videos/*",
        "Condition": {
          "StringEquals": {
            "AWS:SourceArn": `arn:aws:cloudfront::${accountId}:distribution/${distributionId}`
          }
        }
      }
    ]
  };
}

console.log('\n🔧 After creating the distribution, run this script with your details:');
console.log('node setup-cloudfront-cdn.js DISTRIBUTION_ID ACCOUNT_ID');

// If distribution details are provided as arguments
if (process.argv.length >= 4) {
  const distributionId = process.argv[2];
  const accountId = process.argv[3];
  
  console.log('\n📋 S3 Bucket Policy to add:');
  console.log(JSON.stringify(generateBucketPolicy(distributionId, accountId), null, 2));
}
