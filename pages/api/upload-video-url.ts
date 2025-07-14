import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const { filename, filetype } = req.body;
  if (!filename || !filetype) return res.status(400).json({ error: 'Missing filename or filetype' });

  // Create organized path in S3
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const timestamp = Date.now();
  
  // Clean filename and add timestamp to prevent conflicts
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const s3Key = `manual-uploads/${year}/${month}/${day}/${timestamp}-${cleanFilename}`;

  // Check for required environment variables
  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return res.status(500).json({ error: 'Missing AWS credentials in environment variables' });
  }

  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const command = new PutObjectCommand({
    Bucket: 'aiaio3-public-videos',
    Key: s3Key,
    ContentType: filetype,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min expiry

  res.status(200).json({ url, publicUrl: `https://aiaio3-public-videos.s3.amazonaws.com/${s3Key}` });
}