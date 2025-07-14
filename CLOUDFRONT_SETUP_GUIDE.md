# CloudFront CDN Setup Guide for Video Delivery

This guide will help you set up Amazon CloudFront as a CDN for your video files to improve performance and reduce costs.

## Benefits of Using CloudFront

✅ **Faster Video Loading**: Global edge locations reduce latency  
✅ **Reduced S3 Costs**: CloudFront bandwidth is cheaper than S3 bandwidth  
✅ **Better User Experience**: Faster loading, better streaming quality  
✅ **Automatic HTTPS**: Secure video delivery  
✅ **Compression**: Automatic compression for better performance  
✅ **Global Reach**: 400+ edge locations worldwide  

## Step-by-Step Setup

### 1. Create CloudFront Distribution

1. Go to [AWS CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Click **"Create Distribution"**
3. Configure the following settings:

#### Origin Settings
- **Origin Domain**: `aiaio3-public-videos.s3.amazonaws.com`
- **Origin Path**: (leave empty)
- **Name**: `aiaio3-public-videos-origin`
- **Origin Access**: `Origin Access Control settings (recommended)`
- **Origin Access Control**: Create new OAC
  - **Name**: `aiaio3-public-videos-oac`
  - **Description**: `OAC for aiaio3 video bucket`
  - **Signing behavior**: `Sign requests`

#### Default Cache Behavior
- **Path Pattern**: `Default (*)`
- **Compress Objects Automatically**: `Yes`
- **Viewer Protocol Policy**: `Redirect HTTP to HTTPS`
- **Allowed HTTP Methods**: `GET, HEAD, OPTIONS`
- **Cache Policy**: `CachingOptimized`
- **Origin Request Policy**: `UserAgentRefererHeaders`
- **Response Headers Policy**: `SimpleCORS`

#### Distribution Settings
- **Price Class**: `Use All Edge Locations (best performance)`
- **Alternate Domain Names (CNAMEs)**: (optional - your custom domain)
- **SSL Certificate**: `Default CloudFront certificate`
- **Default Root Object**: (leave empty)
- **Enable Logging**: `No` (for now)

#### Security Settings
- **AWS WAF Web ACL**: `Enable security protections` ✅ **RECOMMENDED**
  - Select **Create new security configuration**
  - **Use core rule set**: `Yes`
  - **Use known bad inputs protection**: `Yes`  
  - **Rate limiting**: `100 requests per 5 minutes per IP`
  - **Bot control**: `Yes` (if available in your region)

4. Click **"Create Distribution"**

### 2. Update S3 Bucket Policy

After creating the distribution, AWS will show you the bucket policy to add. Copy your Distribution ID and Account ID, then add this policy to your S3 bucket:

```json
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
```

### 3. Update Environment Variables

Add these to your `.env.local` file:

```bash
# CloudFront Configuration
CLOUDFRONT_DISTRIBUTION_DOMAIN=d7lpoub47y3dp.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=YOUR_DISTRIBUTION_ID
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=d7lpoub47y3dp.cloudfront.net
```

### 4. Test the Distribution

Wait 5-15 minutes for deployment, then test with:
```bash
# Test basic connectivity
curl -I https://d7lpoub47y3dp.cloudfront.net/

# Test with a sample video (replace with actual S3 key)
curl -I https://d7lpoub47y3dp.cloudfront.net/your-video-path.mp4
```

You can also run our test script:
```bash
node test-cloudfront.js
```

## Code Integration

The system automatically uses CloudFront when configured:

### Automatic URL Optimization
```typescript
// API responses automatically include CloudFront URLs
// No code changes needed for existing API endpoints
```

### React Components
```tsx
import OptimizedVideoPlayer from '@/components/OptimizedVideoPlayer';

// This component automatically uses CloudFront
<OptimizedVideoPlayer 
  src={video.video_url} 
  controls 
  className="w-full" 
/>
```

### Custom Hooks
```tsx
import { useOptimizedVideoUrl } from '@/hooks/useOptimizedVideo';

const MyComponent = ({ videoUrl }) => {
  const optimizedUrl = useOptimizedVideoUrl(videoUrl);
  
  return <video src={optimizedUrl} controls />;
};
```

## Monitoring and Analytics

### CloudWatch Metrics
Monitor these key metrics in CloudWatch:
- **Cache Hit Rate**: Should be >80% after warm-up
- **Origin Requests**: Should decrease as cache warms up
- **4xx/5xx Errors**: Should be <1%

### Performance Testing
Test video loading times from different locations:
1. Use [WebPageTest](https://www.webpagetest.org/) 
2. Compare before/after CloudFront setup
3. Monitor real user metrics in your app

## Cost Optimization

### Cache Settings
- **TTL**: Videos can have long cache times (24+ hours)
- **Query Strings**: Cache based on quality parameters if needed
- **Compress**: Enable for all content types

### Price Classes
- **All Edge Locations**: Best performance, higher cost
- **US/Europe**: Good balance for most users
- **US Only**: Lowest cost, limited performance

## Troubleshooting

### Common Issues

1. **403 Forbidden Errors**
   - Check S3 bucket policy
   - Verify OAC configuration
   - Ensure Distribution ID is correct

2. **Slow Initial Load**
   - Expected for first request to each edge location
   - Cache will warm up after initial requests

3. **Wrong Content Returned**
   - Check cache invalidation
   - Verify S3 object keys match CloudFront paths

### Cache Invalidation
If you need to update cached content immediately:
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Advanced Configuration

### AWS WAF Security Rules

Your distribution includes basic WAF protection, but you can customize it further:

#### Recommended Additional Rules

1. **Admin Panel Protection**
```json
{
  "name": "ProtectAdminRoutes",
  "priority": 50,
  "statement": {
    "andStatement": {
      "statements": [
        {
          "byteMatchStatement": {
            "searchString": "/admin",
            "fieldToMatch": {
              "uriPath": {}
            },
            "textTransformations": [
              {
                "priority": 0,
                "type": "LOWERCASE"
              }
            ],
            "positionalConstraint": "STARTS_WITH"
          }
        }
      ]
    }
  },
  "action": {
    "allow": {}
  },
  "visibilityConfig": {
    "sampledRequestsEnabled": true,
    "cloudWatchMetricsEnabled": true,
    "metricName": "AdminRouteRule"
  }
}
```

2. **Video Upload Rate Limiting**
```json
{
  "name": "VideoUploadRateLimit",
  "priority": 75,
  "statement": {
    "rateBasedStatement": {
      "limit": 50,
      "aggregateKeyType": "IP",
      "scopeDownStatement": {
        "byteMatchStatement": {
          "searchString": "/api/upload",
          "fieldToMatch": {
            "uriPath": {}
          },
          "textTransformations": [
            {
              "priority": 0,
              "type": "LOWERCASE"
            }
          ],
          "positionalConstraint": "STARTS_WITH"
        }
      }
    }
  },
  "action": {
    "block": {}
  }
}
```

#### Managing WAF Rules

Access your WAF configuration:
1. Go to [AWS WAF Console](https://console.aws.amazon.com/wafv2/)
2. Select your CloudFront distribution's Web ACL
3. Add custom rules as needed
4. Monitor blocked requests in CloudWatch

#### Cost Considerations

- **Basic WAF**: ~$1/month + $0.60 per million requests
- **Bot Control**: Additional ~$1/month + $0.40 per 10k requests
- **Custom Rules**: $1/month per rule

Total estimated cost for your video platform: **$3-5/month**

### Custom Domain
1. Add CNAME record in your DNS
2. Request SSL certificate in AWS Certificate Manager
3. Update CloudFront distribution with custom domain

### Signed URLs (if needed for private content)
```typescript
// For private video access
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
```

## Next Steps

1. Set up the CloudFront distribution
2. Update your environment variables
3. Test video playback
4. Monitor performance improvements
5. Consider custom domain setup

## Support

If you encounter issues:
1. Check CloudFront distribution status
2. Verify S3 bucket policy
3. Test direct S3 access first
4. Check browser developer tools for errors

---

**Expected Results:**
- 50-80% faster video loading times
- Improved user experience globally
- Reduced S3 bandwidth costs
- Better video streaming quality
