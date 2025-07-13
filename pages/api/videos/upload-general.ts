import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import formidable from 'formidable';
import fs from 'fs';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Create service role client for database operations
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚀 General video upload request received');

  try {
      console.log('📝 Parsing form data...');
      
      // Parse form data
      const form = formidable({
        maxFileSize: 500 * 1024 * 1024, // 500MB limit
        keepExtensions: true,
      });

      const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
        form.parse(req, (err: any, fields: any, files: any) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });

      console.log('✅ Form data parsed successfully');
      console.log('📁 Files received:', Object.keys(files));
      console.log('📋 Fields received:', Object.keys(fields));

      const fileArray = files.file as formidable.File[];
      if (!fileArray || fileArray.length === 0) {
        return res.status(400).json({ error: 'No video file provided' });
      }
      const file = fileArray[0];

      // Extract form fields
      const title = (Array.isArray(fields.title) ? fields.title[0] : fields.title) || '';
      const description = (Array.isArray(fields.description) ? fields.description[0] : fields.description) || '';
      const parentTip = (Array.isArray(fields.parentTip) ? fields.parentTip[0] : fields.parentTip) || '';
      const theme = (Array.isArray(fields.theme) ? fields.theme[0] : fields.theme) || '';
      const ageRange = (Array.isArray(fields.ageRange) ? fields.ageRange[0] : fields.ageRange) || '';
      const duration = parseInt((Array.isArray(fields.duration) ? fields.duration[0] : fields.duration) || '0') || 0;
      const tags = JSON.parse((Array.isArray(fields.tags) ? fields.tags[0] : fields.tags) || '[]');
      const displayImageUrl = (Array.isArray(fields.displayImageUrl) ? fields.displayImageUrl[0] : fields.displayImageUrl) || '';
      const accessToken = (Array.isArray(fields.accessToken) ? fields.accessToken[0] : fields.accessToken) || '';

      if (!title || !description || !parentTip) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      console.log('🔐 Authenticating user...');
      
      // Check authentication using token from FormData
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
      
      if (authError || !user) {
        console.error('❌ Authentication failed:', authError);
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('✅ User authenticated:', user.email);

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('🔍 User data:', userData);
    console.log('🔍 User error:', userError);

    if (userError || !userData || !['content_manager', 'asset_creator', 'video_ops'].includes(userData.role)) {
      console.log('❌ User role check failed. User role:', userData?.role);
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('✅ User role verified:', userData.role);

    console.log('📤 Preparing S3 upload...');
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.originalFilename?.split('.').pop() || 'mp4';
    const fileName = `general-videos/${timestamp}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;

    console.log('📁 File details:', {
      originalName: file.originalFilename,
      filepath: file.filepath,
      size: file.size,
      mimetype: file.mimetype,
      fileName: fileName
    });

    // Upload to S3
    console.log('📖 Reading file buffer...');
    const fileBuffer = fs.readFileSync(file.filepath);
    console.log('✅ File buffer read, size:', fileBuffer.length);
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_VIDEO_BUCKET!,
      Key: fileName,
      Body: fileBuffer,
      ContentType: file.mimetype || 'video/mp4',
      Metadata: {
        title,
        description,
        parentTip,
        theme,
        ageRange,
        duration: duration.toString(),
        tags: JSON.stringify(tags),
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log('🚀 Uploading to S3...');
    console.log('📦 S3 details:', {
      bucket: process.env.AWS_S3_VIDEO_BUCKET,
      region: process.env.AWS_REGION,
      key: fileName
    });
    
    await s3Client.send(uploadCommand);
    console.log('✅ S3 upload successful');

    // Generate public URL
    const videoUrl = `https://${process.env.AWS_S3_VIDEO_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Use provided display image URL or generate a placeholder thumbnail
    const thumbnailUrl = displayImageUrl || `https://${process.env.AWS_S3_VIDEO_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/thumbnails/${timestamp}_thumb.jpg`;

          // Create entry in child_approved_videos table for manual upload
      console.log('📝 Creating child_approved_videos entry for manual upload...');
      
      const insertData = {
        video_generation_job_id: null,
        video_source: 'manual_upload',
        video_title: title,
        consumer_title: title,
        consumer_description: description,
        parent_tip: parentTip,
        video_url: videoUrl,
        display_image_url: thumbnailUrl,
        child_name: 'General Upload', // Placeholder since this is a general video
        child_age: parseInt(ageRange.split('-')[0]) || 3, // Use min age from range
        child_theme: theme || 'general',
        personalization_level: 'generic',
        approval_status: 'approved',
        metadata_status: 'approved',
        submitted_by: user.id,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        duration_seconds: duration,
        template_type: 'general',
        template_data: {
          theme: theme,
          ageRange: ageRange,
          tags: tags,
          uploadedVia: 'general-video-upload',
          parentTip: parentTip
        }
      };
      
      console.log('📋 Insert data:', JSON.stringify(insertData, null, 2));
      
            const { data: videoEntry, error: dbError } = await supabaseService
        .from('child_approved_videos')
        .insert(insertData)
        .select()
        .single();

    if (dbError) {
      console.error('❌ Error creating video entry:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('✅ Video entry created:', videoEntry.id);

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    console.log('✅ General video uploaded successfully:', {
      fileName,
      videoUrl,
      title,
      theme,
      uploadedBy: user.id,
    });

    res.status(200).json({
      success: true,
      videoUrl,
      thumbnailUrl,
      fileName,
      title,
      theme,
    });

  } catch (error) {
    console.error('❌ Error uploading general video:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 