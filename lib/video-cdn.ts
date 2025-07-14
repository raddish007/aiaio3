// Utility functions for handling video URLs with CloudFront CDN support
// This module provides functions to convert S3 URLs to CloudFront URLs and vice versa

/**
 * Convert an S3 URL to CloudFront URL if CloudFront is configured
 * @param {string} s3Url - The original S3 URL
 * @returns {string} - CloudFront URL or original S3 URL if CloudFront not configured
 */
export function getOptimizedVideoUrl(s3Url: string): string {
  // Check if CloudFront is configured
  const cloudFrontDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
  
  if (!cloudFrontDomain || !s3Url) {
    return s3Url;
  }

  // Extract the S3 key from the URL
  // Handle both formats:
  // - https://aiaio3-public-videos.s3.amazonaws.com/path/to/video.mp4
  // - https://s3.amazonaws.com/aiaio3-public-videos/path/to/video.mp4
  let s3Key = '';
  
  if (s3Url.includes('aiaio3-public-videos.s3.amazonaws.com/')) {
    s3Key = s3Url.split('aiaio3-public-videos.s3.amazonaws.com/')[1];
  } else if (s3Url.includes('s3.amazonaws.com/aiaio3-public-videos/')) {
    s3Key = s3Url.split('s3.amazonaws.com/aiaio3-public-videos/')[1];
  } else {
    // If it's not an S3 URL for our bucket, return as-is
    return s3Url;
  }

  // Construct CloudFront URL
  return `https://${cloudFrontDomain}/${s3Key}`;
}

/**
 * Get the original S3 URL from a CloudFront URL
 * @param {string} cloudFrontUrl - The CloudFront URL
 * @returns {string} - Original S3 URL
 */
export function getOriginalS3Url(cloudFrontUrl: string): string {
  const cloudFrontDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
  
  if (!cloudFrontDomain || !cloudFrontUrl.includes(cloudFrontDomain)) {
    return cloudFrontUrl;
  }

  // Extract the key from CloudFront URL
  const s3Key = cloudFrontUrl.split(`${cloudFrontDomain}/`)[1];
  
  // Return S3 URL
  return `https://aiaio3-public-videos.s3.amazonaws.com/${s3Key}`;
}

/**
 * Check if CloudFront is properly configured
 * @returns {boolean} - True if CloudFront is configured
 */
export function isCloudFrontConfigured() {
  return !!process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
}

/**
 * Get video URL with optional CloudFront optimization
 * @param {string} videoUrl - Original video URL
 * @param {boolean} useCloudFront - Whether to use CloudFront (default: true)
 * @returns {string} - Optimized video URL
 */
export function getVideoUrl(videoUrl: string, useCloudFront: boolean = true): string {
  if (!useCloudFront || !isCloudFrontConfigured()) {
    return videoUrl;
  }
  
  return getOptimizedVideoUrl(videoUrl);
}

// For server-side usage
export function getOptimizedVideoUrlServer(s3Url: string): string {
  const cloudFrontDomain = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN;
  
  if (!cloudFrontDomain || !s3Url) {
    return s3Url;
  }

  let s3Key = '';
  
  if (s3Url.includes('aiaio3-public-videos.s3.amazonaws.com/')) {
    s3Key = s3Url.split('aiaio3-public-videos.s3.amazonaws.com/')[1];
  } else if (s3Url.includes('s3.amazonaws.com/aiaio3-public-videos/')) {
    s3Key = s3Url.split('s3.amazonaws.com/aiaio3-public-videos/')[1];
  } else {
    return s3Url;
  }

  return `https://${cloudFrontDomain}/${s3Key}`;
}
