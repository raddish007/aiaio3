// Debug script to check S3 bucket contents vs database records
const { createClient } = require('@supabase/supabase-js');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function checkS3DatabaseSync() {
  console.log('🔍 Checking S3 bucket contents vs database records...\n');

  try {
    // 1. Get all videos from database
    console.log('📊 Fetching videos from database...');
    const { data: videos, error: dbError } = await supabase
      .from('child_approved_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return;
    }

    console.log(`Found ${videos.length} videos in database\n`);

    // 2. Get S3 bucket contents
    console.log('📦 Fetching S3 bucket contents...');
    try {
      const s3Response = await s3Client.send(new ListObjectsV2Command({
        Bucket: 'aiaio3-public-videos'
      }));

      const s3Objects = s3Response.Contents || [];
      console.log(`Found ${s3Objects.length} objects in S3 bucket\n`);

      // 3. Analyze video types and URLs
      console.log('📹 Analyzing video types and URLs...\n');
      
      const manualUploads = videos.filter(v => v.video_source === 'manual_upload');
      const generatedVideos = videos.filter(v => v.video_source === 'generated');
      const unknownSource = videos.filter(v => !v.video_source);

      console.log(`Manual uploads: ${manualUploads.length}`);
      console.log(`Generated videos: ${generatedVideos.length}`);
      console.log(`Unknown source: ${unknownSource.length}\n`);

      // 4. Check URL patterns
      console.log('🔗 Checking URL patterns...\n');
      
      const remotionUrls = videos.filter(v => v.video_url.includes('remotionlambda'));
      const publicS3Urls = videos.filter(v => v.video_url.includes('aiaio3-public-videos'));
      const otherUrls = videos.filter(v => 
        !v.video_url.includes('remotionlambda') && 
        !v.video_url.includes('aiaio3-public-videos')
      );

      console.log(`Remotion URLs: ${remotionUrls.length}`);
      console.log(`Public S3 URLs: ${publicS3Urls.length}`);
      console.log(`Other URLs: ${otherUrls.length}\n`);

      // 5. Check published videos specifically
      console.log('📤 Checking published videos...\n');
      
      const publishedVideos = videos.filter(v => v.is_published === true);
      console.log(`Published videos: ${publishedVideos.length}`);
      
      publishedVideos.forEach((video, i) => {
        console.log(`${i + 1}. ${video.video_title}`);
        console.log(`   Source: ${video.video_source || 'unknown'}`);
        console.log(`   URL: ${video.video_url}`);
        console.log(`   Published: ${video.is_published}`);
        console.log(`   Created: ${video.created_at}\n`);
      });

      // 6. Check for missing files in S3
      console.log('🔍 Checking for videos with S3 URLs but missing files...\n');
      
      let missingCount = 0;
      for (const video of publicS3Urls) {
        // Extract S3 key from URL
        const urlParts = video.video_url.replace('https://aiaio3-public-videos.s3.amazonaws.com/', '');
        const s3Key = urlParts;
        
        // Check if this key exists in S3
        const exists = s3Objects.some(obj => obj.Key === s3Key);
        
        if (!exists) {
          console.log(`❌ Missing in S3: ${video.video_title}`);
          console.log(`   URL: ${video.video_url}`);
          console.log(`   Expected S3 Key: ${s3Key}\n`);
          missingCount++;
        }
      }

      if (missingCount === 0) {
        console.log('✅ All videos with S3 URLs have corresponding files in S3');
      } else {
        console.log(`❌ Found ${missingCount} videos with S3 URLs but missing files`);
      }

      // 7. Show recent S3 uploads
      console.log('\n📦 Recent S3 uploads (last 10):');
      const recentObjects = s3Objects
        .sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))
        .slice(0, 10);

      recentObjects.forEach((obj, i) => {
        console.log(`${i + 1}. ${obj.Key}`);
        console.log(`   Size: ${(obj.Size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Modified: ${obj.LastModified}\n`);
      });

    } catch (s3Error) {
      console.error('❌ S3 error:', s3Error.message);
      console.log('This might be due to missing S3 permissions');
    }

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

// Run the check
checkS3DatabaseSync().then(() => {
  console.log('✅ S3-Database sync check complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
