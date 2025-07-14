// Test API to get children and test video delivery
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { getOptimizedVideoUrlServer } from '@/lib/video-cdn';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 Testing complete video delivery pipeline...');
    
    // Get children
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .limit(3);

    if (childrenError) {
      throw childrenError;
    }

    // Get some approved videos
    const { data: videos, error: videosError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('approval_status', 'approved')
      .limit(5)
      .order('created_at', { ascending: false });

    if (videosError) {
      throw videosError;
    }

    const videoTests = videos.map(video => {
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
        isPublicBucket: originalUrl?.includes('aiaio3-public-videos') || false,
        urlTransformation: {
          from: originalUrl,
          to: optimizedUrl,
          transformed: originalUrl !== optimizedUrl
        }
      };
    });

    const cdnAnalysis = {
      environment: {
        cloudFrontConfigured: !!process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN,
        cloudFrontDomain: process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN,
        publicCloudFrontDomain: process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN
      },
      database: {
        totalChildren: children.length,
        totalApprovedVideos: videos.length,
        videosInPublicBucket: videoTests.filter(v => v.isPublicBucket).length,
        videosTransformedToCDN: videoTests.filter(v => v.isUsingCDN).length
      },
      sampleChildren: children.map(child => ({
        id: child.id,
        name: child.name,
        age: child.age,
        theme: child.primary_interest
      }))
    };

    res.status(200).json({
      message: 'Complete video delivery pipeline test',
      cdnAnalysis,
      videoTests,
      summary: {
        pipelineWorking: cdnAnalysis.environment.cloudFrontConfigured && 
                         videoTests.length > 0 && 
                         videoTests.every(v => v.isPublicBucket && v.isUsingCDN),
        allVideosInCDN: videoTests.every(v => v.isPublicBucket && v.isUsingCDN),
        readyForKidsPage: cdnAnalysis.database.totalChildren > 0 && 
                          cdnAnalysis.database.totalApprovedVideos > 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Error testing video delivery pipeline:', error);
    res.status(500).json({
      error: 'Failed to test video delivery pipeline',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
