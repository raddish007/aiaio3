import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKETS } from './aws';

export interface VideoUploadOptions {
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  storageClass?: 'STANDARD' | 'STANDARD_IA' | 'REDUCED_REDUNDANCY';
}

export interface VideoInfo {
  key: string;
  size: number;
  lastModified: Date;
  storageClass: string;
  metadata?: Record<string, string>;
  url: string;
}

export class S3VideoManager {
  private static readonly DEFAULT_EXPIRATION = 3600; // 1 hour for signed URLs
  
  /**
   * Generate a presigned URL for uploading large videos directly to S3
   */
  static async getUploadUrl(options: VideoUploadOptions): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKETS.VIDEOS,
      Key: options.key,
      ContentType: options.contentType || 'video/mp4',
      Metadata: options.metadata,
      StorageClass: options.storageClass || 'STANDARD',
      Tagging: options.tags ? new URLSearchParams(options.tags).toString() : undefined,
    });

    return getSignedUrl(s3Client, command, { 
      expiresIn: this.DEFAULT_EXPIRATION 
    });
  }

  /**
   * Upload a video buffer directly to S3
   */
  static async uploadVideo(
    buffer: Buffer, 
    options: VideoUploadOptions
  ): Promise<{ key: string; url: string }> {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKETS.VIDEOS,
      Key: options.key,
      Body: buffer,
      ContentType: options.contentType || 'video/mp4',
      Metadata: options.metadata,
      StorageClass: options.storageClass || 'STANDARD',
      Tagging: options.tags ? new URLSearchParams(options.tags).toString() : undefined,
    });

    await s3Client.send(command);

    const url = `https://${S3_BUCKETS.VIDEOS}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${options.key}`;
    
    return { key: options.key, url };
  }

  /**
   * Delete a video from S3
   */
  static async deleteVideo(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKETS.VIDEOS,
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * Get video information from S3
   */
  static async getVideoInfo(key: string): Promise<VideoInfo | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: S3_BUCKETS.VIDEOS,
        Key: key,
      });

      const response = await s3Client.send(command);
      
      return {
        key,
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        storageClass: response.StorageClass || 'STANDARD',
        metadata: response.Metadata,
        url: `https://${S3_BUCKETS.VIDEOS}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
      };
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return null;
      }
      throw error;
    }
  }

  /**
   * List videos in a specific folder/prefix
   */
  static async listVideos(prefix: string = 'videos/', maxKeys: number = 100): Promise<VideoInfo[]> {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKETS.VIDEOS,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);
    const videos: VideoInfo[] = [];

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key && object.Key.endsWith('.mp4')) {
          videos.push({
            key: object.Key,
            size: object.Size || 0,
            lastModified: object.LastModified || new Date(),
            storageClass: object.StorageClass || 'STANDARD',
            url: `https://${S3_BUCKETS.VIDEOS}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${object.Key}`
          });
        }
      }
    }

    return videos;
  }

  /**
   * Generate a presigned URL for downloading/viewing a video
   */
  static async getViewUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new HeadObjectCommand({
      Bucket: S3_BUCKETS.VIDEOS,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Move a video to a different storage class (for cost optimization)
   * Note: This requires using CopyObject command instead of PutObject
   */
  static async changeStorageClass(
    key: string, 
    storageClass: 'STANDARD' | 'STANDARD_IA' | 'GLACIER' | 'DEEP_ARCHIVE'
  ): Promise<void> {
    // Get current object
    const currentInfo = await this.getVideoInfo(key);
    if (!currentInfo) {
      throw new Error(`Video ${key} not found`);
    }

    // For changing storage class, we would typically use a CopyObject command
    // For now, we'll note that this operation would require additional implementation
    console.log(`Storage class change for ${key} to ${storageClass} - requires CopyObject implementation`);
    
    // TODO: Implement with CopyObjectCommand when needed
    throw new Error('Storage class change not yet implemented - use lifecycle policies instead');
  }

  /**
   * Get total storage usage and costs estimation
   */
  static async getStorageStats(): Promise<{
    totalObjects: number;
    totalSize: number;
    estimatedMonthlyCost: number;
    storageBreakdown: Record<string, { count: number; size: number }>;
  }> {
    const videos = await this.listVideos('', 1000); // Get more videos for accurate stats
    
    let totalSize = 0;
    const storageBreakdown: Record<string, { count: number; size: number }> = {};

    for (const video of videos) {
      totalSize += video.size;
      
      const storageClass = video.storageClass || 'STANDARD';
      if (!storageBreakdown[storageClass]) {
        storageBreakdown[storageClass] = { count: 0, size: 0 };
      }
      storageBreakdown[storageClass].count++;
      storageBreakdown[storageClass].size += video.size;
    }

    // Rough cost estimation (varies by region)
    const costPerGB = {
      'STANDARD': 0.023,
      'STANDARD_IA': 0.0125,
      'GLACIER': 0.004,
      'DEEP_ARCHIVE': 0.00099
    };

    let estimatedMonthlyCost = 0;
    for (const [storageClass, stats] of Object.entries(storageBreakdown)) {
      const gbSize = stats.size / (1024 * 1024 * 1024);
      const rate = costPerGB[storageClass as keyof typeof costPerGB] || costPerGB.STANDARD;
      estimatedMonthlyCost += gbSize * rate;
    }

    return {
      totalObjects: videos.length,
      totalSize,
      estimatedMonthlyCost: Math.round(estimatedMonthlyCost * 100) / 100,
      storageBreakdown
    };
  }

  /**
   * Generate organized folder structure for videos
   */
  static generateVideoKey(type: 'user-generated' | 'remotion' | 'temp', videoId: string, filename?: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sanitizedFilename = filename?.replace(/[^a-zA-Z0-9.-]/g, '_') || `video-${Date.now()}.mp4`;
    
    switch (type) {
      case 'user-generated':
        return `videos/user-generated/${timestamp}/${videoId}/${sanitizedFilename}`;
      case 'remotion':
        return `videos/remotion/${timestamp}/${videoId}/${sanitizedFilename}`;
      case 'temp':
        return `videos/temp/${videoId}/${sanitizedFilename}`;
      default:
        return `videos/misc/${videoId}/${sanitizedFilename}`;
    }
  }
}

// Helper functions for common operations
export const s3VideoUtils = {
  /**
   * Clean up old temporary videos (called by cron job)
   */
  async cleanupTempVideos(olderThanDays: number = 7): Promise<number> {
    const tempVideos = await S3VideoManager.listVideos('videos/temp/', 1000);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let deletedCount = 0;
    for (const video of tempVideos) {
      if (video.lastModified < cutoffDate) {
        await S3VideoManager.deleteVideo(video.key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  },

  /**
   * Get video URL with appropriate access level
   */
  async getVideoAccessUrl(key: string, isPublic: boolean = false): Promise<string> {
    if (isPublic) {
      return `https://${S3_BUCKETS.VIDEOS}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    } else {
      return S3VideoManager.getViewUrl(key, 3600); // 1 hour expiration
    }
  }
};
