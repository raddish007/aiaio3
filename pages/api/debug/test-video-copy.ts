// Test API endpoint to verify video approval copy function
import type { NextApiRequest, NextApiResponse } from 'next';
import { copyRemotionVideoToPublicBucket } from '@/lib/video-approval';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Testing video approval copy function via API...');
    
    // Test URL from the S3 debug - we found this file exists
    const testOriginalUrl = 'https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/renders/04hhuyoiup/out.mp4';
    const testVideoId = 'test-video-123';
    const testChildName = 'TestChild';
    
    console.log('📝 Test parameters:');
    console.log('   Original URL:', testOriginalUrl);
    console.log('   Video ID:', testVideoId);
    console.log('   Child Name:', testChildName);
    
    console.log('🔄 Attempting to copy video...');
    const result = await copyRemotionVideoToPublicBucket(testOriginalUrl, testVideoId, testChildName);
    
    console.log('✅ Copy successful!');
    console.log('📤 New public URL:', result);
    
    res.status(200).json({
      success: true,
      originalUrl: testOriginalUrl,
      newUrl: result,
      message: 'Video copy test successful'
    });
    
  } catch (error: any) {
    console.error('❌ Copy failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      errorCode: error.code || 'N/A',
      statusCode: error.$metadata?.httpStatusCode || 'N/A',
      message: 'Video copy test failed'
    });
  }
}
