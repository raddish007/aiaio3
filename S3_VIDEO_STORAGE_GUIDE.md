# S3 Video Storage Analysis & Setup Guide

## Current Situation Summary

### 🎬 Video Storage Status
- **Current Storage**: Remotion-generated videos are stored in S3 (`aiaio-videos` bucket)
- **Retention Policy**: **INDEFINITE** - No lifecycle policies configured
- **Cost Impact**: Videos accumulate without deletion, increasing costs over time
- **Larger Videos**: No current infrastructure for non-Remotion video uploads

### 📊 What We Found
1. **S3 Buckets**: `aiaio-videos` and `aiaio-assets` configured but not accessible (missing AWS credentials)
2. **Current Usage**: Only Remotion Lambda uses S3 for video output
3. **No Lifecycle Management**: Videos never expire or transition to cheaper storage
4. **Database Tracking**: Video metadata stored in Supabase `assets` table with S3 URLs

### 💰 Cost Implications
- **Current**: All videos in STANDARD storage class ($0.023/GB/month)
- **Without Lifecycle**: Costs grow linearly with video count
- **Potential Savings**: 50-80% cost reduction with proper lifecycle policies

---

## 🚀 Recommended S3 Setup

### 1. Lifecycle Policies Implementation
**Cost optimization without automatic deletion:**

```javascript
// Video Bucket Lifecycle (script: setup-s3-lifecycle-policies.js)
- ✅ Videos preserved permanently (NO automatic deletion)
- Move to STANDARD_IA after 30 days (50% cost reduction)
- Archive to GLACIER after 90 days (83% cost reduction)
- Clean up incomplete uploads after 7 days
- Manual deletion only via admin interface
```

### 2. Storage Organization
**Organized folder structure for different video types:**

```
videos/
├── remotion/           # Remotion Lambda outputs
│   └── YYYY-MM-DD/
├── user-generated/     # User uploaded videos  
│   └── YYYY-MM-DD/
└── temp/              # Temporary processing files
    └── (auto-cleanup after 7 days)
```

### 3. Video Upload Infrastructure
**New capabilities for larger video files:**

- **Direct Upload API**: `/api/videos/upload` for files up to 50MB
- **Presigned URLs**: For large file uploads directly to S3
- **Storage Management**: `/api/videos/storage` for monitoring and cleanup
- **Database Integration**: Automatic metadata storage in Supabase

---

## 🛠️ Implementation Steps

### Step 1: Configure AWS Credentials
```bash
# Add to your .env file
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_VIDEO_BUCKET=aiaio-videos
AWS_S3_ASSET_BUCKET=aiaio-assets
```

### Step 2: Set Up Lifecycle Policies
```bash
# Run the lifecycle setup script
node scripts/setup-s3-lifecycle-policies.js
```

### Step 3: Test Video Upload
```bash
# Test the new video upload API
curl -X GET "http://localhost:3000/api/videos/upload?filename=test.mp4"
```

### Step 4: Monitor Storage
```bash
# Check storage stats
curl "http://localhost:3000/api/videos/storage?action=stats"
```

---

## 📈 Expected Benefits

### Cost Savings
- **30 days**: 50% reduction (STANDARD → STANDARD_IA)
- **90 days**: 83% reduction (STANDARD → GLACIER)
- **Manual control**: Delete only when needed via admin interface

### Storage Efficiency
- **Manual cleanup** via admin interface
- **Organized structure** for different video types
- **Monitoring tools** for usage tracking

### Scalability
- **Large file support** via presigned URLs
- **Direct S3 uploads** without server bottlenecks
- **Flexible retention** policies per video type

---

## 🔧 Files Created/Modified

### New Files
- `scripts/setup-s3-lifecycle-policies.js` - S3 lifecycle management (cost optimization only)
- `lib/s3-video-manager.ts` - Video storage utilities
- `pages/api/videos/upload.ts` - Video upload API
- `pages/api/videos/storage.ts` - Storage monitoring API
- `pages/admin/video-storage.tsx` - Admin interface for video management

### Existing Usage
- `pages/api/videos/generate-template.ts` - Remotion video output
- `lib/aws.ts` - S3 client configuration
- Database: `assets` table stores video metadata and S3 URLs

---

## 🎯 Next Steps

1. **Set up AWS credentials** in your environment
2. **Run lifecycle setup script** to configure retention policies
3. **Test video upload functionality** with the new APIs
4. **Monitor storage usage** and costs
5. **Consider upgrading** to larger instance if processing big videos

### Optional Enhancements
- **CDN integration** for faster video delivery
- **Video transcoding** for different quality levels
- **Background processing** for large video operations
- **Admin dashboard** for storage management

---

## 🚨 Current Issues to Address

1. **Missing AWS Credentials**: Can't access S3 buckets currently
2. **No Retention Policy**: Videos accumulate indefinitely
3. **Limited Upload Size**: Current infrastructure only handles Remotion outputs
4. **Cost Monitoring**: No visibility into S3 storage costs

**Priority**: Set up AWS credentials and lifecycle policies first to prevent cost accumulation.
