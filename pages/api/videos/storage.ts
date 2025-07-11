import { NextApiRequest, NextApiResponse } from 'next';
import { S3VideoManager, s3VideoUtils } from '@/lib/s3-video-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.query;

    switch (action) {
      case 'stats':
        return handleGetStats(req, res);
      case 'list':
        return handleListVideos(req, res);
      case 'cleanup':
        return handleCleanup(req, res);
      default:
        return handleGetStats(req, res);
    }
  } catch (error) {
    console.error('S3 management error:', error);
    return res.status(500).json({
      error: 'S3 operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get storage statistics and costs
 */
async function handleGetStats(req: NextApiRequest, res: NextApiResponse) {
  try {
    const stats = await S3VideoManager.getStorageStats();
    
    // Format the response with human-readable sizes
    const formattedStats = {
      ...stats,
      totalSizeFormatted: s3VideoUtils.formatFileSize(stats.totalSize),
      storageBreakdownFormatted: Object.entries(stats.storageBreakdown).reduce((acc, [key, value]) => {
        acc[key] = {
          ...value,
          sizeFormatted: s3VideoUtils.formatFileSize(value.size)
        };
        return acc;
      }, {} as Record<string, any>)
    };

    return res.status(200).json({
      success: true,
      stats: formattedStats,
      recommendations: generateStorageRecommendations(stats)
    });
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return res.status(500).json({
      error: 'Failed to get storage statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * List videos with filtering options
 */
async function handleListVideos(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      prefix = '', 
      maxResults = '50',
      type 
    } = req.query;

    let searchPrefix = prefix as string;
    if (type) {
      // Map type filters to actual prefixes where videos are stored
      switch (type) {
        case 'remotion':
          searchPrefix = 'renders/';
          break;
        case 'user-generated':
          searchPrefix = 'videos/user-generated/';
          break;
        case 'temp':
          searchPrefix = 'videos/temp/';
          break;
        default:
          searchPrefix = '';
      }
    }

    const videos = await S3VideoManager.listVideos(
      searchPrefix, 
      parseInt(maxResults as string)
    );

    // Add formatted sizes and ages
    const formattedVideos = videos.map(video => ({
      ...video,
      sizeFormatted: s3VideoUtils.formatFileSize(video.size),
      ageInDays: Math.floor((Date.now() - video.lastModified.getTime()) / (1000 * 60 * 60 * 24))
    }));

    return res.status(200).json({
      success: true,
      videos: formattedVideos,
      count: formattedVideos.length,
      totalSize: videos.reduce((sum, v) => sum + v.size, 0),
      totalSizeFormatted: s3VideoUtils.formatFileSize(
        videos.reduce((sum, v) => sum + v.size, 0)
      )
    });
  } catch (error) {
    console.error('Error listing videos:', error);
    return res.status(500).json({
      error: 'Failed to list videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Clean up old temporary videos
 */
async function handleCleanup(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { olderThanDays = '7', dryRun = 'true' } = req.query;
    
    if (dryRun === 'true') {
      // Just show what would be deleted
      const tempVideos = await S3VideoManager.listVideos('videos/temp/', 1000);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays as string));
      
      const toDelete = tempVideos.filter(video => video.lastModified < cutoffDate);
      const totalSize = toDelete.reduce((sum, v) => sum + v.size, 0);

      return res.status(200).json({
        success: true,
        dryRun: true,
        wouldDelete: toDelete.length,
        wouldFreeUp: s3VideoUtils.formatFileSize(totalSize),
        videos: toDelete.map(v => ({
          key: v.key,
          size: s3VideoUtils.formatFileSize(v.size),
          age: Math.floor((Date.now() - v.lastModified.getTime()) / (1000 * 60 * 60 * 24))
        }))
      });
    } else {
      // Actually delete the files
      const deletedCount = await s3VideoUtils.cleanupTempVideos(
        parseInt(olderThanDays as string)
      );

      return res.status(200).json({
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} temporary videos older than ${olderThanDays} days`
      });
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    return res.status(500).json({
      error: 'Cleanup operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate storage optimization recommendations
 */
function generateStorageRecommendations(stats: any): string[] {
  const recommendations: string[] = [];
  
  if (stats.estimatedMonthlyCost > 50) {
    recommendations.push('Consider implementing lifecycle policies to automatically move old videos to cheaper storage classes');
  }
  
  if (stats.storageBreakdown.STANDARD?.size > 5 * 1024 * 1024 * 1024) { // 5GB
    recommendations.push('You have significant data in STANDARD storage. Consider moving older videos to STANDARD_IA or GLACIER');
  }
  
  if (stats.totalObjects > 1000) {
    recommendations.push('Large number of videos detected. Consider implementing automatic cleanup for temporary files');
  }
  
  if (!stats.storageBreakdown.STANDARD_IA && !stats.storageBreakdown.GLACIER) {
    recommendations.push('No videos in cost-optimized storage classes. Lifecycle policies could reduce costs');
  }

  if (recommendations.length === 0) {
    recommendations.push('Your storage usage looks optimized!');
  }
  
  return recommendations;
}
