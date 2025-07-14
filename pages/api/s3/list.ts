import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '@/lib/supabase';

// Use the same configuration as your existing upload endpoint
const BUCKET_NAME = 'aiaio3-public-videos';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prefix = '' } = req.query;
    const prefixStr = Array.isArray(prefix) ? prefix[0] : prefix;

    // Check for required environment variables
    if (process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      try {
        console.log(`🔍 Trying S3 listing with prefix: "${prefixStr}"`);

        const command = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: prefixStr,
          Delimiter: '/', // This helps separate folders from files
          MaxKeys: 1000, // Adjust as needed
        });

        const data = await s3.send(command);

        // Process folders (CommonPrefixes)
        const folders = (data.CommonPrefixes || []).map((prefix: any) => prefix.Prefix || '');

        // Process files (Contents)
        const objects = await Promise.all((data.Contents || [])
          .filter((obj: any) => obj.Key !== prefixStr) // Exclude the prefix itself if it's a "folder"
          .map(async (obj: any) => {
            // Generate signed URL for viewing (expires in 1 hour)
            let url: string | undefined;
            try {
              const getCommand = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: obj.Key,
              });
              url = await getSignedUrl(s3, getCommand, { expiresIn: 3600 }); // 1 hour
            } catch (urlError) {
              console.error(`Error generating signed URL for ${obj.Key}:`, urlError);
              // Use direct S3 URL as fallback
              url = `https://${BUCKET_NAME}.s3.amazonaws.com/${obj.Key}`;
            }

            return {
              key: obj.Key || '',
              lastModified: obj.LastModified?.toISOString() || '',
              size: obj.Size || 0,
              url
            };
          }));

        console.log(`📁 S3 listing successful: Found ${folders.length} folders and ${objects.length} files`);

        const response = {
          objects,
          folders,
          prefix: prefixStr,
          source: 's3',
          message: 'Files loaded directly from S3 bucket'
        };

        return res.status(200).json(response);

      } catch (s3Error: any) {
        console.log(`⚠️ S3 listing failed (${s3Error.name}), falling back to database...`);
        // Fall through to database fallback
      }
    }

    // Fallback: Get video files from database
    console.log('🔍 Getting video files from database instead of S3 listing...');

    const { data: videos, error } = await supabase
      .from('child_approved_videos')
      .select('id, video_url, video_title, created_at, duration_seconds, template_data')
      .eq('approval_status', 'approved')
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Process the videos to extract S3 object info
    const objects = await Promise.all((videos || []).map(async (video) => {
      // Extract filename from S3 URL
      const key = video.video_url.replace(`https://${BUCKET_NAME}.s3.amazonaws.com/`, '');
      
      // Try to get object metadata (this only requires GetObject permission, not ListBucket)
      let size = 0;
      let lastModified = video.created_at;
      
      return {
        key,
        title: video.video_title,
        lastModified,
        size,
        url: video.video_url,
        databaseId: video.id,
        duration: video.duration_seconds,
        metadata: video.template_data
      };
    }));

    console.log(`📁 Found ${objects.length} video files in database`);

    const response = {
      objects,
      folders: [], // No folder support without list permissions
      prefix: '',
      source: 'database', // Indicate this came from database, not S3 listing
      message: 'Video files loaded from database (S3 list permissions not available)'
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Error getting video files:', error);
    
    let errorMessage = 'Failed to get video files';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(500).json({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
