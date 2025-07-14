#!/usr/bin/env node

// Script to handle the remaining general upload videos
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { S3Client, CopyObjectCommand } = require('@aws-sdk/client-s3');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function migrateGeneralUploads() {
  try {
    console.log('🔍 Finding failed general upload videos...\n');
    
    const failedVideoIds = [
      'd7731755-9438-4eea-b1db-5c22df3e7aec',
      '7c6cb3ed-2132-49d5-ac9d-fc10cbe1f176'
    ];
    
    for (const videoId of failedVideoIds) {
      const { data: video, error } = await supabase
        .from('child_approved_videos')
        .select('*')
        .eq('id', videoId)
        .single();
        
      if (error || !video) {
        console.log(`❌ Could not find video ${videoId}`);
        continue;
      }
      
      console.log(`🔄 Migrating: ${video.child_name} - ${video.template_type}`);
      console.log(`   Original URL: ${video.video_url}`);
      
      // Extract the file path from the URL for general uploads
      // URL: https://remotionlambda-useast1-3pwoq46nsa.s3.us-east-1.amazonaws.com/general-videos/1752448746744_The_Stakeout.mov
      const urlParts = video.video_url.split('/');
      const fileName = urlParts[urlParts.length - 1]; // 1752448746744_The_Stakeout.mov
      const folderPath = urlParts.slice(-2, -1)[0]; // general-videos
      
      // Create new path in public bucket
      const videoDate = new Date(video.created_at);
      const year = videoDate.getFullYear();
      const month = String(videoDate.getMonth() + 1).padStart(2, '0');
      const day = String(videoDate.getDate()).padStart(2, '0');
      
      const cleanChildName = video.child_name.replace(/[^a-zA-Z0-9]/g, '');
      const newKey = `approved-videos/${year}/${month}/${day}/${video.id}-${cleanChildName}-${fileName}`;
      
      console.log(`   📁 Source: ${folderPath}/${fileName}`);
      console.log(`   📤 Destination: ${newKey}`);
      
      try {
        const copyCommand = new CopyObjectCommand({
          CopySource: `remotionlambda-useast1-3pwoq46nsa/${folderPath}/${fileName}`,
          Bucket: 'aiaio3-public-videos',
          Key: newKey,
          MetadataDirective: 'REPLACE',
          Metadata: {
            'original-url': video.video_url,
            'video-id': video.id,
            'child-name': video.child_name,
            'template-type': video.template_type,
            'migrated-date': new Date().toISOString(),
            'migration-type': 'manual-general-upload'
          },
        });

        await s3Client.send(copyCommand);
        
        const publicUrl = `https://aiaio3-public-videos.s3.amazonaws.com/${newKey}`;
        console.log(`   ✅ Copied to: ${publicUrl}`);
        
        // Update database record
        const { error: updateError } = await supabase
          .from('child_approved_videos')
          .update({
            video_url: publicUrl,
            template_data: {
              ...video.template_data,
              migration: {
                originalUrl: video.video_url,
                migratedUrl: publicUrl,
                migratedAt: new Date().toISOString(),
                migrationType: 'manual-general-upload'
              }
            }
          })
          .eq('id', video.id);

        if (updateError) {
          throw updateError;
        }
        
        console.log(`   💾 Database updated`);
        console.log(`   🎉 Migration complete!\n`);
        
      } catch (error) {
        console.error(`   ❌ Migration failed: ${error.message}\n`);
      }
    }
    
    console.log('✅ General upload migration complete!');
    
  } catch (error) {
    console.error('❌ Error in general upload migration:', error);
  }
}

migrateGeneralUploads();
