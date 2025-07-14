import { useMemo } from 'react';
import { getOptimizedVideoUrl, isCloudFrontConfigured } from '@/lib/video-cdn';

/**
 * Hook to get optimized video URL using CloudFront CDN
 * @param videoUrl - Original video URL
 * @param useCloudFront - Whether to use CloudFront optimization (default: true)
 * @returns Optimized video URL
 */
export function useOptimizedVideoUrl(videoUrl: string, useCloudFront: boolean = true) {
  return useMemo(() => {
    if (!useCloudFront || !videoUrl) {
      return videoUrl;
    }
    
    return getOptimizedVideoUrl(videoUrl);
  }, [videoUrl, useCloudFront]);
}

/**
 * Hook to check if CloudFront CDN is available
 * @returns boolean indicating if CloudFront is configured
 */
export function useCloudFrontStatus() {
  return useMemo(() => {
    return isCloudFrontConfigured();
  }, []);
}

/**
 * Hook for batch video URL optimization
 * @param videoUrls - Array of video URLs
 * @param useCloudFront - Whether to use CloudFront optimization (default: true)
 * @returns Array of optimized video URLs
 */
export function useOptimizedVideoUrls(videoUrls: string[], useCloudFront: boolean = true) {
  return useMemo(() => {
    if (!useCloudFront || !videoUrls.length) {
      return videoUrls;
    }
    
    return videoUrls.map(url => getOptimizedVideoUrl(url));
  }, [videoUrls, useCloudFront]);
}
