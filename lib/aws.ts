import { S3Client } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { SESClient } from '@aws-sdk/client-ses';

// AWS Configuration
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// S3 Client for video storage
export const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Lambda Client for Remotion rendering
export const lambdaClient = new LambdaClient({
  region: awsRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// SES Client for email notifications
export const sesClient = new SESClient({
  region: awsRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// S3 bucket names
export const S3_BUCKETS = {
  VIDEOS: process.env.AWS_S3_VIDEO_BUCKET || 'aiaio-videos',
  ASSETS: process.env.AWS_S3_ASSET_BUCKET || 'aiaio-assets',
} as const;

// Lambda function names
export const LAMBDA_FUNCTIONS = {
  REMOTION_RENDER: process.env.AWS_LAMBDA_REMOTION_FUNCTION || 'aiaio-remotion-render',
} as const; 