import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabaseAdmin } from '@/lib/supabase';

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
          // Remove Delimiter to get recursive listing (all files in folder and subfolders)
          MaxKeys: 1000, // Adjust as needed
        });

        const data = await s3.send(command);

        // Process folders and files from recursive listing
        const allObjects = data.Contents || [];
        
        // Extract folders from object keys (any key ending with / is a folder)
        const folderSet = new Set<string>();
        const fileObjects = allObjects.filter((obj: any) => {
          if (!obj.Key) return false;
          
          // If the key ends with /, it's a folder
          if (obj.Key.endsWith('/')) {
            folderSet.add(obj.Key);
            return false; // Don't include folders as files
          }
          
          // Skip the prefix itself if it's a "folder"
          if (obj.Key === prefixStr) return false;
          
          return true;
        });

        // Convert folder set to array and sort
        const folders = Array.from(folderSet).sort();

        // Process files (Contents)
        const objects = await Promise.all(fileObjects.map(async (obj: any) => {
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

        // Now fetch database metadata to merge with S3 objects
        console.log('🔍 Fetching database metadata to merge with S3 objects...');
        
        // Check if admin client is available
        if (!supabaseAdmin) {
          console.error('❌ Supabase admin client not available - cannot fetch database metadata');
          return res.status(500).json({ error: 'Database access not configured' });
        }
        
        // Get all videos from database tables that might match these S3 objects
        const { data: allVideos, error: videosError } = await supabaseAdmin
          .from('child_approved_videos')
          .select('id, video_url, video_title, created_at, duration_seconds, template_data, approval_status')
          .not('video_url', 'is', null);

        const { data: availableVideos, error: availableError } = await supabaseAdmin
          .from('child_available_videos')
          .select('id, video_url, video_title, created_at, duration_seconds, template_data')
          .not('video_url', 'is', null);

        const { data: publishedVideos, error: publishedError } = await supabaseAdmin
          .from('published_videos')
          .select('id, video_url, title, created_at, duration_seconds, metadata, is_published')
          .not('video_url', 'is', null);

        if (videosError) console.error('Error fetching approved videos for metadata:', videosError);
        if (availableError) console.error('Error fetching available videos for metadata:', availableError);
        if (publishedError) console.error('Error fetching published videos for metadata:', publishedError);
        
        console.log(`📊 Database query results: ${allVideos?.length || 0} approved videos, ${availableVideos?.length || 0} available videos, ${publishedVideos?.length || 0} published videos`);

        // Create a lookup map for quick matching
        const videoLookup = new Map();
        
        // Add approved videos to lookup
        if (allVideos) {
          allVideos.forEach(video => {
            const key = video.video_url.replace(`https://${BUCKET_NAME}.s3.amazonaws.com/`, '');
            videoLookup.set(key, {
              ...video,
              source: 'child_approved_videos'
            });
            
            // Also try matching by UUID if present in the URL
            const uuidMatch = video.video_url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
            if (uuidMatch) {
              videoLookup.set(uuidMatch[0], {
                ...video,
                source: 'child_approved_videos'
              });
            }
          });
        }

        // Add available videos to lookup
        if (availableVideos) {
          availableVideos.forEach(video => {
            const key = video.video_url.replace(`https://${BUCKET_NAME}.s3.amazonaws.com/`, '');
            videoLookup.set(key, {
              ...video,
              source: 'child_available_videos'
            });
            
            // Also try matching by UUID if present in the URL
            const uuidMatch = video.video_url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
            if (uuidMatch) {
              videoLookup.set(uuidMatch[0], {
                ...video,
                source: 'child_available_videos'
              });
            }
          });
        }

        // Add published videos to lookup
        if (publishedVideos) {
          publishedVideos.forEach(video => {
            const key = video.video_url.replace(`https://${BUCKET_NAME}.s3.amazonaws.com/`, '');
            videoLookup.set(key, {
              ...video,
              source: 'published_videos'
            });
            
            // Also try matching by UUID if present in the URL
            const uuidMatch = video.video_url.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
            if (uuidMatch) {
              videoLookup.set(uuidMatch[0], {
                ...video,
                source: 'published_videos'
              });
            }
          });
        }



        // Merge S3 objects with database metadata
        const mergedObjects = objects.map(obj => {
          // Try exact key match first
          let dbVideo = videoLookup.get(obj.key);
          

          
          // If no exact match, try matching by UUID in the key
          if (!dbVideo) {
            const uuidMatch = obj.key.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
            if (uuidMatch) {
              dbVideo = videoLookup.get(uuidMatch[0]);
              

            }
          }
          
          if (dbVideo) {
            return {
              ...obj,
              title: dbVideo.video_title || dbVideo.title || 'Untitled Video',
              databaseId: dbVideo.id,
              duration: dbVideo.duration_seconds,
              metadata: dbVideo.template_data || dbVideo.metadata,
              source: dbVideo.source,
              // Add additional metadata
              approvalStatus: dbVideo.approval_status,
              isPublished: dbVideo.is_published,
              createdAt: dbVideo.created_at
            };
          }

          // If no database match, try to extract a meaningful title from the filename
          const filename = obj.key.split('/').pop() || '';
          let extractedTitle = filename;
          
          // Remove common prefixes and extensions
          extractedTitle = extractedTitle.replace(/\.(mp4|mov|avi|mkv)$/i, '');
          extractedTitle = extractedTitle.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/, '');
          extractedTitle = extractedTitle.replace(/^[0-9]+-/, '');
          extractedTitle = extractedTitle.replace(/_/g, ' ').replace(/-/g, ' ');
          
          // Capitalize first letter of each word
          extractedTitle = extractedTitle.split(' ').map((word: string) => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');

          return {
            ...obj,
            title: extractedTitle || 'Untitled Video',
            source: 's3_only'
          };
        });

        console.log(`📁 S3 listing successful: Found ${folders.length} folders and ${mergedObjects.length} files (${videoLookup.size} matched with database metadata)`);

        const response = {
          objects: mergedObjects,
          folders,
          prefix: prefixStr,
          source: 's3',
          message: `Files loaded directly from S3 bucket with database metadata (${videoLookup.size} videos matched)`
        };

        return res.status(200).json(response);

      } catch (s3Error: any) {
        console.log(`⚠️ S3 listing failed (${s3Error.name}), falling back to database...`);
        // Fall through to database fallback
      }
    }

    // Fallback: Get video files from database
    console.log('🔍 Getting video files from database instead of S3 listing...');

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not available - cannot fetch database fallback');
      return res.status(500).json({ error: 'Database access not configured' });
    }

    // Get videos from child_approved_videos table
    const { data: approvedVideos, error: approvedError } = await supabaseAdmin
      .from('child_approved_videos')
      .select('id, video_url, video_title, created_at, duration_seconds, template_data')
      .eq('approval_status', 'approved')
      .not('video_url', 'is', null);

    if (approvedError) {
      console.error('Error fetching approved videos:', approvedError);
    }

    // Get videos from published_videos table
    const { data: publishedVideos, error: publishedError } = await supabaseAdmin
      .from('published_videos')
      .select('id, video_url, title, created_at, duration_seconds, metadata')
      .eq('is_published', true)
      .not('video_url', 'is', null);

    if (publishedError) {
      console.error('Error fetching published videos:', publishedError);
    }

    // Get assets from assets table (images, audio, video, prompts)
    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('id, url, file_url, theme, type, created_at, metadata')
      .or('url.not.is.null,file_url.not.is.null');

    if (assetsError) {
      console.error('Error fetching assets:', assetsError);
    }

    // Get videos from child_available_videos table
    const { data: availableVideos, error: availableError } = await supabaseAdmin
      .from('child_available_videos')
      .select('id, video_url, video_title, created_at, duration_seconds, template_data')
      .not('video_url', 'is', null);

    if (availableError) {
      console.error('Error fetching available videos:', availableError);
    }

    // Combine all results
    const allObjects = [];

    // Process approved videos
    if (approvedVideos) {
      const approvedObjects = approvedVideos.map((video) => {
        const key = video.video_url.replace(`https://${BUCKET_NAME}.s3.amazonaws.com/`, '');
        return {
          key,
          title: video.video_title,
          lastModified: video.created_at,
          size: 0, // Size not available in this table
          url: video.video_url,
          databaseId: video.id,
          duration: video.duration_seconds,
          metadata: video.template_data,
          source: 'child_approved_videos'
        };
      });
      allObjects.push(...approvedObjects);
    }

    // Process published videos
    if (publishedVideos) {
      const publishedObjects = publishedVideos.map((video) => {
        const key = video.video_url.replace(`https://${BUCKET_NAME}.s3.amazonaws.com/`, '');
        return {
          key,
          title: video.title,
          lastModified: video.created_at,
          size: 0, // Size not available in this table
          url: video.video_url,
          databaseId: video.id,
          duration: video.duration_seconds,
          metadata: video.metadata,
          source: 'published_videos'
        };
      });
      allObjects.push(...publishedObjects);
    }

    // Process assets
    if (assets) {
      const assetObjects = assets.map((asset) => {
        const url = asset.url || asset.file_url;
        if (!url) return null;
        
        const key = url.replace(`https://${BUCKET_NAME}.s3.amazonaws.com/`, '');
        return {
          key,
          title: asset.theme,
          lastModified: asset.created_at,
          size: 0, // Size not available in this table
          url,
          databaseId: asset.id,
          duration: asset.metadata?.duration,
          metadata: asset.metadata,
          source: 'assets',
          type: asset.type
        };
      }).filter(Boolean); // Remove null entries
      allObjects.push(...assetObjects);
    }

    // Process available videos
    if (availableVideos) {
      const availableObjects = availableVideos.map((video) => {
        const key = video.video_url.replace(`https://${BUCKET_NAME}.s3.amazonaws.com/`, '');
        return {
          key,
          title: video.video_title,
          lastModified: video.created_at,
          size: 0, // Size not available in this table
          url: video.video_url,
          databaseId: video.id,
          duration: video.duration_seconds,
          metadata: video.template_data,
          source: 'child_available_videos'
        };
      });
      allObjects.push(...availableObjects);
    }

    console.log(`📁 Found ${allObjects.length} total objects in database (${approvedVideos?.length || 0} approved videos, ${publishedVideos?.length || 0} published videos, ${assets?.length || 0} assets, ${availableVideos?.length || 0} available videos)`);

    const response = {
      objects: allObjects,
      folders: [], // No folder support without list permissions
      prefix: '',
      source: 'database', // Indicate this came from database, not S3 listing
      message: `Files loaded from database: ${approvedVideos?.length || 0} approved videos, ${publishedVideos?.length || 0} published videos, ${assets?.length || 0} assets, ${availableVideos?.length || 0} available videos (S3 list permissions not available)`
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
