// Test API to check if videos are served through CDN
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { getOptimizedVideoUrlServer } from '@/lib/video-cdn';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Testing CDN video delivery...');
    
    // Get a sample of approved videos from the database
    const { data: videos, error } = await supabase
      .from('child_approved_videos')
      .select('id, child_name, template_type, video_url')
      .eq('approval_status', 'approved')
      .limit(5)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const results = videos.map(video => {
      const originalUrl = video.video_url;
      const optimizedUrl = getOptimizedVideoUrlServer(originalUrl);
      
      return {
        videoId: video.id,
        childName: video.child_name,
        templateType: video.template_type,
        originalUrl,
        optimizedUrl,
        isUsingCDN: optimizedUrl !== originalUrl,
        isCDNUrl: optimizedUrl.includes('cloudfront.net'),
        isPublicBucket: originalUrl.includes('aiaio3-public-videos')
      };
    });

    const cdnStatus = {
      cloudFrontConfigured: !!process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN,
      cloudFrontDomain: process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN,
      publicCloudFrontDomain: process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN,
      totalVideos: results.length,
      videosUsingCDN: results.filter(r => r.isUsingCDN).length,
      videosInPublicBucket: results.filter(r => r.isPublicBucket).length
    };

    res.status(200).json({
      message: 'CDN delivery test results',
      cdnStatus,
      videoSamples: results,
      summary: {
        allVideosInPublicBucket: results.every(r => r.isPublicBucket),
        allVideosUsingCDN: results.every(r => r.isUsingCDN),
        cdnWorking: cdnStatus.cloudFrontConfigured && results.every(r => r.isUsingCDN && r.isPublicBucket)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error testing CDN delivery:', error);
    res.status(500).json({
      error: 'Failed to test CDN delivery',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
