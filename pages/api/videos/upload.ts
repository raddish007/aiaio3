import { NextApiRequest, NextApiResponse } from 'next';
import { S3VideoManager } from '@/lib/s3-video-manager';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handleUploadRequest(req, res);
  } else if (req.method === 'GET') {
    return handleGetUploadUrl(req, res);
  } else if (req.method === 'DELETE') {
    return handleDeleteVideo(req, res);
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Handle direct video upload (for smaller files)
 */
async function handleUploadRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { videoData, metadata, videoType = 'user-generated' } = req.body;

    if (!videoData) {
      return res.status(400).json({ error: 'Video data is required' });
    }

    // Generate unique video ID and key
    const videoId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const videoKey = S3VideoManager.generateVideoKey(videoType, videoId, metadata?.filename);

    // Convert base64 to buffer if needed
    let videoBuffer: Buffer;
    if (typeof videoData === 'string') {
      videoBuffer = Buffer.from(videoData, 'base64');
    } else {
      videoBuffer = Buffer.from(videoData);
    }

    // Upload to S3
    const uploadResult = await S3VideoManager.uploadVideo(videoBuffer, {
      key: videoKey,
      contentType: metadata?.contentType || 'video/mp4',
      metadata: {
        originalName: metadata?.filename || 'unknown',
        uploadedBy: metadata?.userId || 'anonymous',
        uploadedAt: new Date().toISOString(),
        videoType: videoType
      },
      tags: {
        type: videoType,
        userId: metadata?.userId || 'anonymous'
      }
    });

    // Save metadata to database
    if (supabaseAdmin) {
      const { data: asset, error } = await supabaseAdmin
        .from('assets')
        .insert({
          type: 'video',
          theme: metadata?.theme || 'user-content',
          tags: [videoType, 'user-upload'],
          age_range: metadata?.ageRange || '2-5',
          status: metadata?.autoApprove ? 'approved' : 'pending',
          created_by: metadata?.userId,
          file_url: uploadResult.url,
          metadata: {
            s3Key: videoKey,
            fileSize: videoBuffer.length,
            duration: metadata?.duration,
            originalFilename: metadata?.filename,
            videoType: videoType
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving video metadata to database:', error);
        // Don't fail the request, just log the error
      }

      return res.status(200).json({
        success: true,
        videoId,
        s3Key: videoKey,
        url: uploadResult.url,
        assetId: asset?.id,
        message: 'Video uploaded successfully'
      });
    }

    return res.status(200).json({
      success: true,
      videoId,
      s3Key: videoKey,
      url: uploadResult.url,
      message: 'Video uploaded successfully'
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return res.status(500).json({
      error: 'Video upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate presigned URL for large file uploads
 */
async function handleGetUploadUrl(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      filename, 
      contentType = 'video/mp4', 
      videoType = 'user-generated',
      userId 
    } = req.query;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Generate unique video ID and key
    const videoId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const videoType_ = (videoType as string === 'remotion' || videoType as string === 'temp') ? 
      videoType as 'user-generated' | 'remotion' | 'temp' : 'user-generated';
    const videoKey = S3VideoManager.generateVideoKey(
      videoType_, 
      videoId, 
      filename as string
    );

    // Generate presigned upload URL
    const uploadUrl = await S3VideoManager.getUploadUrl({
      key: videoKey,
      contentType: contentType as string,
      metadata: {
        originalName: filename as string,
        uploadedBy: userId as string || 'anonymous',
        uploadedAt: new Date().toISOString(),
        videoType: videoType_ as string
      },
      tags: {
        type: videoType_ as string,
        userId: userId as string || 'anonymous'
      }
    });

    return res.status(200).json({
      success: true,
      uploadUrl,
      videoId,
      s3Key: videoKey,
      expiresIn: 3600, // 1 hour
      message: 'Upload URL generated successfully'
    });

  } catch (error) {
    console.error('Error generating upload URL:', error);
    return res.status(500).json({
      error: 'Failed to generate upload URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Delete a video from S3 and database
 */
async function handleDeleteVideo(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { s3Key, assetId } = req.body;

    if (!s3Key) {
      return res.status(400).json({ error: 'S3 key is required' });
    }

    // Delete from S3
    await S3VideoManager.deleteVideo(s3Key);

    // Delete from database if asset ID provided
    if (assetId && supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) {
        console.error('Error deleting asset from database:', error);
        // Continue anyway since S3 deletion succeeded
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Video deletion error:', error);
    return res.status(500).json({
      error: 'Video deletion failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Increase body size limit for video uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Adjust as needed
    },
  },
};
