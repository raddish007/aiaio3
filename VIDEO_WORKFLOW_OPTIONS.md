# Video Publishing Workflow Options

## Current Situation
You have videos in two places:
- **Remotion bucket**: New AI-generated videos (private, no CDN)
- **Public bucket**: Manual uploads + migrated videos (public, with CDN)

## Workflow Options

### Option A: Manual Batch Migration (Your Original Plan)
```
1. Create video → Remotion bucket
2. Review video in admin panel
3. When ready to publish: Run migration script
4. Do metadata reviews/approvals
5. Update child playlists
```

**Pros**: 
- Full control over when videos move to public bucket
- Can batch process multiple videos at once

**Cons**: 
- Extra manual step
- Videos don't get CDN benefits until migrated
- Easy to forget the migration step

### Option B: Auto-Migration on Approval (Recommended)
```
1. Create video → Remotion bucket
2. Review video in admin panel
3. Click "Approve" → Auto-copies to public bucket + marks approved
4. Update child playlists (includes newly approved videos)
```

**Pros**: 
- One-click approval + migration
- Videos immediately get CDN benefits
- No manual migration step to forget
- Cleaner workflow

**Cons**: 
- Less control over when videos move

### Option C: Hybrid Approach
```
1. Create video → Remotion bucket
2. Review video in admin panel
3. Choose: "Approve Only" OR "Approve + Publish"
4. Update child playlists
```

## Recommended Implementation

I recommend **Option B** with this enhanced workflow:

### 1. Video Creation (No Change)
```typescript
// Remotion generates video → stores in Remotion bucket
const result = await renderMediaOnLambda({...});
// Video URL: https://remotionlambda-.../renders/abc123/out.mp4
```

### 2. Enhanced Approval Process
Instead of just changing status, approval also migrates:

```typescript
// When you click "Approve" in admin panel
await approveVideoWithMigration(videoId);
// This does:
// 1. Copies video to public bucket
// 2. Updates URL to public bucket
// 3. Marks as approved
// 4. Adds migration metadata
```

### 3. Simplified Playlist Update
```typescript
// This already works - just update playlists
// Now includes both general uploads AND approved Remotion videos
```

## Implementation Steps

### Phase 1: Enhanced Approval (Immediate)
1. ✅ Use the `approveVideoWithMigration()` function I created
2. Update your video approval UI to use this function
3. Videos get migrated automatically when approved

### Phase 2: Batch Migration (Existing Videos)
1. Use the batch migration script for videos already approved
2. This is a one-time cleanup for existing videos

### Phase 3: Admin UI Enhancement (Optional)
Create an approval interface with options:
- "Approve Only" (keeps in Remotion bucket)
- "Approve & Publish" (migrates to public bucket)
- "Reject" (marks as rejected)

## Current Status

✅ **Ready to use:**
- General video upload → public bucket
- Batch migration script for existing videos
- Enhanced playlist system (includes both sources)
- Auto-migration on approval function

🔲 **Next steps:**
1. Try the general video upload first
2. Run batch migration for existing approved videos
3. Test the enhanced approval workflow
4. Set up CloudFront CDN

## Decision Point

**Which workflow do you prefer?**

- **Option A**: Keep your manual batch approach (use existing migration script)
- **Option B**: Auto-migrate on approval (use new `approveVideoWithMigration` function)
- **Option C**: Build hybrid UI with both options

All the code is ready for any option you choose!
