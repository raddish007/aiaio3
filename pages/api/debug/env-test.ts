// Test API endpoint to verify environment variables are available in Next.js context
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const envStatus = {
    AWS_REGION: process.env.AWS_REGION || 'MISSING',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'MISSING',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'MISSING',
    AWS_S3_VIDEO_BUCKET: process.env.AWS_S3_VIDEO_BUCKET || 'MISSING',
    NODE_ENV: process.env.NODE_ENV
  };

  // Also test S3 connection in Next.js context
  if (req.method === 'POST') {
    return testS3Connection(req, res, envStatus);
  }

  res.status(200).json({
    message: 'Environment variable status in Next.js context',
    env: envStatus,
    timestamp: new Date().toISOString()
  });
}

async function testS3Connection(req: NextApiRequest, res: NextApiResponse, envStatus: any) {
  try {
    const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    // Test connection to aiaio3-public-videos bucket
    const headCommand = new HeadBucketCommand({ Bucket: 'aiaio3-public-videos' });
    await s3Client.send(headCommand);

    res.status(200).json({
      message: 'S3 connection test successful',
      env: envStatus,
      s3Status: 'CONNECTED',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(500).json({
      message: 'S3 connection test failed',
      env: envStatus,
      s3Status: 'FAILED',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
