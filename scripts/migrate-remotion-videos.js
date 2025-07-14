// Script to migrate Remotion-generated videos from aiaio-videos bucket to aiaio3-public-videos bucket
const { S3Client, CopyObjectCommand, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SOURCE_BUCKET = 'aiaio-videos';
const TARGET_BUCKET = 'aiaio3-public-videos';

async function migrateRemotionVideos() {
  console.log('🚀 Starting Remotion video migration...');

  try {
    // 1. Get all approved videos with Remotion URLs
    const { data: videos, error: fetchError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('approval_status', 'approved')
      .like('video_url', `%${SOURCE_BUCKET}%`);

    if (fetchError) {
      console.error('❌ Error fetching videos:', fetchError);
      return;
    }

    console.log(`📹 Found ${videos.length} Remotion videos to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const video of videos) {
      try {
        console.log(`\n🔄 Processing: ${video.video_title} (ID: ${video.id})`);
        
        // Extract the S3 key from the URL
        const videoUrl = video.video_url;
        const urlParts = videoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const sourceKey = fileName.includes('.') ? fileName : `${fileName}.mp4`;
        
        // Generate new key for target bucket (organize by date/type)
        const createdDate = new Date(video.created_at);
        const year = createdDate.getFullYear();
        const month = String(createdDate.getMonth() + 1).padStart(2, '0');
        const targetKey = `remotion-migrated/${year}/${month}/${video.id}-${sourceKey}`;
        
        console.log(`   📂 Copying from: ${SOURCE_BUCKET}/${sourceKey}`);
        console.log(`   📂 Copying to: ${TARGET_BUCKET}/${targetKey}`);

        // Copy the video file
        const copyCommand = new CopyObjectCommand({
          CopySource: `${SOURCE_BUCKET}/${sourceKey}`,
          Bucket: TARGET_BUCKET,
          Key: targetKey,
          MetadataDirective: 'REPLACE',
          Metadata: {
            'original-bucket': SOURCE_BUCKET,
            'original-key': sourceKey,
            'migrated-date': new Date().toISOString(),
            'video-id': video.id,
            'video-title': video.video_title.replace(/[^a-zA-Z0-9\s]/g, ''), // Remove special chars
          },
        });

        await s3Client.send(copyCommand);

        // Generate new public URL
        const newVideoUrl = `https://${TARGET_BUCKET}.s3.amazonaws.com/${targetKey}`;
        
        // If you have CloudFront, use that instead:
        // const newVideoUrl = `https://your-cloudfront-domain.com/${targetKey}`;

        // Update the database with the new URL
        const { error: updateError } = await supabase
          .from('child_approved_videos')
          .update({
            video_url: newVideoUrl,
            template_data: {
              ...video.template_data,
              migration: {
                originalUrl: videoUrl,
                migratedAt: new Date().toISOString(),
                originalBucket: SOURCE_BUCKET,
                newBucket: TARGET_BUCKET,
              }
            }
          })
          .eq('id', video.id);

        if (updateError) {
          console.error(`   ❌ Database update failed for ${video.video_title}:`, updateError);
          errorCount++;
        } else {
          console.log(`   ✅ Successfully migrated: ${video.video_title}`);
          successCount++;
        }

      } catch (videoError) {
        console.error(`   ❌ Failed to migrate ${video.video_title}:`, videoError.message);
        errorCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 Migration complete!');
    console.log(`✅ Successfully migrated: ${successCount} videos`);
    console.log(`❌ Failed to migrate: ${errorCount} videos`);

    if (successCount > 0) {
      console.log('\n📋 Next steps:');
      console.log('1. Update your child playlists to refresh the URLs');
      console.log('2. Test video playback with the new URLs');
      console.log('3. Set up CloudFront CDN for better performance');
      console.log('4. Consider cleanup of old videos after verification');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Export for use in API routes
module.exports = { migrateRemotionVideos };

// Run directly if called from command line
if (require.main === module) {
  migrateRemotionVideos();
}
