// Enhanced video approval that automatically copies to public bucket
import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '@/lib/supabase';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function copyRemotionVideoToPublicBucket(originalUrl: string, videoId: string, childName: string) {
  // Extract the file key from Remotion URL
  // Example: https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/abc123/out.mp4
  const urlParts = originalUrl.split('/');
  const renderId = urlParts[urlParts.length - 2]; // abc123
  const fileName = urlParts[urlParts.length - 1]; // out.mp4
  
  // Create organized path in public bucket
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const newKey = `approved-videos/${year}/${month}/${day}/${videoId}-${childName.replace(/[^a-zA-Z0-9]/g, '')}-${fileName}`;
  
  try {
    // Copy from Remotion bucket to public bucket
    const copyCommand = new CopyObjectCommand({
      CopySource: `remotionlambda-useast1-3pwoq46nsa/renders/${renderId}/${fileName}`,
      Bucket: 'aiaio3-public-videos',
      Key: newKey,
      MetadataDirective: 'REPLACE',
      Metadata: {
        'original-url': originalUrl,
        'video-id': videoId,
        'child-name': childName,
        'approved-date': new Date().toISOString(),
      },
    });

    await s3Client.send(copyCommand);
    
    // Return new public URL
    const publicUrl = `https://aiaio3-public-videos.s3.amazonaws.com/${newKey}`;
    
    console.log(`✅ Video copied to public bucket: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Failed to copy video to public bucket:', error);
    throw error;
  }
}

// Function to approve a video and automatically migrate it
async function approveVideoWithMigration(videoId: string) {
  try {
    // 1. Get the video record
    const { data: video, error: fetchError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (fetchError || !video) {
      throw new Error('Video not found');
    }

    // 2. Copy to public bucket
    const publicUrl = await copyRemotionVideoToPublicBucket(
      video.video_url,
      video.id,
      video.child_name
    );

    // 3. Update video record with new URL and approval
    const { error: updateError } = await supabase
      .from('child_approved_videos')
      .update({
        video_url: publicUrl,
        approval_status: 'approved',
        reviewed_at: new Date().toISOString(),
        template_data: {
          ...video.template_data,
          migration: {
            originalUrl: video.video_url,
            migratedAt: new Date().toISOString(),
            migrationType: 'auto-on-approval'
          }
        }
      })
      .eq('id', videoId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Video ${videoId} approved and migrated to public bucket`);
    return { success: true, newUrl: publicUrl };

  } catch (error) {
    console.error('❌ Failed to approve and migrate video:', error);
    throw error;
  }
}

// Export for ES6 imports
export { approveVideoWithMigration, copyRemotionVideoToPublicBucket };
