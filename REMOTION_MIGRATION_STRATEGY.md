# Remotion Video Migration Strategy

## Overview
This document outlines the strategy to migrate Remotion-generated videos from the default Remotion Lambda bucket to your public S3 bucket with CDN support.

## Current State
- **Remotion videos**: `remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/{renderId}/out.mp4`
- **Manual uploads**: `aiaio3-public-videos.s3.amazonaws.com/{path}/{filename}`
- **Goal**: Unify all videos in `aiaio3-public-videos` with CloudFront CDN

## Migration Steps

### 1. Immediate Migration (Existing Videos)
Run the migration script to copy existing videos:

```bash
# Option A: Run via admin panel
# Go to /admin/migrate-remotion-videos and click "Start Migration"

# Option B: Run via terminal
node scripts/migrate-remotion-videos.js
```

**What this does:**
- Copies videos from Remotion bucket to `aiaio3-public-videos`
- Updates database URLs to point to new bucket
- Preserves original files (no deletion)
- Organizes videos by date: `remotion-migrated/YYYY/MM/{video-id}-{filename}`

### 2. Update Child Playlists
After migration, refresh all child playlists:

```bash
# Via admin panel: /admin/update-child-playlists
# Via terminal: node scripts/update-child-playlists.js
```

### 3. Future Remotion Renders (Optional Enhancement)
To make new Remotion videos save directly to your bucket, you have two options:

#### Option A: Post-Render Copy (Recommended)
Keep current Remotion setup but add a post-render copy step:

```typescript
// In your video generation API
const result = await renderMediaOnLambda({ ... });
const remotionUrl = result.outputUrl;

// Copy to your public bucket
const publicUrl = await copyToPublicBucket(remotionUrl, childId, renderId);

// Save publicUrl to database instead of remotionUrl
```

#### Option B: Custom Remotion Bucket (Advanced)
Configure Remotion to render directly to your bucket:

```typescript
const result = await renderMediaOnLambda({
  // ... other config
  outName: 'out.mp4',
  bucketName: 'aiaio3-public-videos', // Your bucket
  // Note: This requires Remotion bucket permissions setup
});
```

### 4. CloudFront CDN Setup (Recommended)
Set up CloudFront distribution for `aiaio3-public-videos`:

1. **Create CloudFront Distribution**:
   - Origin: `aiaio3-public-videos.s3.amazonaws.com`
   - Origin Path: leave empty
   - Viewer Protocol Policy: Redirect HTTP to HTTPS

2. **Update URLs in code**:
   ```typescript
   // Replace direct S3 URLs with CloudFront
   const cdnUrl = publicUrl.replace(
     'https://aiaio3-public-videos.s3.amazonaws.com',
     'https://your-cloudfront-domain.cloudfront.net'
   );
   ```

## Implementation Priority

### High Priority (Do First):
1. ✅ Run migration script for existing videos
2. ✅ Update child playlists
3. ✅ Test video playback
4. 🔲 Set up CloudFront CDN

### Medium Priority (Do Later):
1. 🔲 Implement post-render copy for new videos
2. 🔲 Update video generation APIs to use public URLs
3. 🔲 Add CDN URLs to all video references

### Low Priority (Optional):
1. 🔲 Clean up old videos in Remotion bucket
2. 🔲 Configure custom Remotion bucket
3. 🔲 Add video compression/optimization

## Benefits After Migration

### Performance:
- ✅ CDN acceleration for all videos
- ✅ Faster global video delivery
- ✅ Reduced S3 bandwidth costs

### Consistency:
- ✅ All videos in one bucket
- ✅ Unified access patterns
- ✅ Simplified video management

### Scalability:
- ✅ Better caching control
- ✅ Custom domain support
- ✅ Enhanced security options

## Files Created/Modified

### Migration Tools:
- `scripts/migrate-remotion-videos.js` - Migration script
- `pages/api/admin/migrate-remotion-videos.ts` - API endpoint
- `pages/admin/migrate-remotion-videos.tsx` - Admin interface

### Playlist Updates:
- `scripts/update-child-playlists.js` - Updated to include published videos
- `pages/admin/update-child-playlists.tsx` - Updated UI

### Database:
- `create_published_videos_table.sql` - New table for general videos

## Testing Checklist

After migration:
- [ ] Test video playback on `/video-playback` page
- [ ] Verify child playlists include migrated videos
- [ ] Check video URLs in database point to new bucket
- [ ] Confirm CDN delivery (if implemented)
- [ ] Test new video uploads work correctly

## Rollback Plan

If issues occur:
1. Revert database URLs to original Remotion URLs
2. Run playlist update to restore original state
3. Original videos remain in Remotion bucket (not deleted)

## Next Steps

1. **Run the migration** via `/admin/migrate-remotion-videos`
2. **Test thoroughly** using the testing checklist
3. **Set up CloudFront** for CDN acceleration
4. **Update future video generation** to use public bucket

The migration preserves all original videos, so it's safe to run and can be rolled back if needed.
