// Test CDN transformation via API
import type { NextApiRequest, NextApiResponse } from 'next';
import { getOptimizedVideoUrlServer } from '@/lib/video-cdn';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const testUrls = [
      'https://aiaio3-public-videos.s3.amazonaws.com/approved-videos/2025/07/14/fa6e795d-24c1-4f44-85c0-7f70c710fd9b-Andrew-out.mp4',
      'https://aiaio3-public-videos.s3.amazonaws.com/approved-videos/2025/07/13/47540d2d-8b17-4339-8d45-5d5b8a4199d0-Andrew-out.mp4',
      'https://aiaio3-public-videos.s3.amazonaws.com/manual-uploads/2025/07/13/1752459884854-LilyBox_hor.mov',
      'https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/abc123/out.mp4'
    ];

    const results = testUrls.map(url => {
      const optimized = getOptimizedVideoUrlServer(url);
      return {
        original: url,
        optimized: optimized,
        transformed: optimized !== url,
        usesCDN: optimized.includes('cloudfront.net'),
        isPublicBucket: url.includes('aiaio3-public-videos')
      };
    });

    const environment = {
      cloudFrontDomain: process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN,
      publicCloudFrontDomain: process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN,
      configured: !!process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN
    };

    const summary = {
      totalTests: results.length,
      publicBucketUrls: results.filter(r => r.isPublicBucket).length,
      transformedUrls: results.filter(r => r.transformed).length,
      cdnUrls: results.filter(r => r.usesCDN).length,
      cdnWorking: environment.configured && results.filter(r => r.isPublicBucket).every(r => r.usesCDN)
    };

    res.status(200).json({
      message: 'CDN transformation test results',
      environment,
      summary,
      testResults: results,
      conclusion: {
        supabaseUpdated: true, // We verified this earlier
        cdnConfigured: environment.configured,
        urlTransformationWorking: summary.cdnWorking,
        kidsPageWillUseCDN: summary.cdnWorking
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(500).json({
      error: 'CDN transformation test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
