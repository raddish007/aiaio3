#!/usr/bin/env node

// Script to find and migrate already published videos
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { S3Client, CopyObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

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

async function findPublishedVideosNeedingMigration() {
  try {
    console.log('🔍 Finding published videos that need migration...\n');
    
    // Get all approved videos
    const { data: videos, error } = await supabase
      .from('child_approved_videos')
      .select('*')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`📊 Found ${videos.length} approved videos total`);

    // Filter videos that need migration
    const remotionVideos = videos.filter(v => 
      v.video_url && 
      v.video_url.includes('remotionlambda') && 
      !v.template_data?.migration
    );

    const alreadyMigrated = videos.filter(v => 
      v.video_url && 
      (v.video_url.includes('aiaio3-public-videos') || v.template_data?.migration)
    );

    const otherVideos = videos.filter(v => 
      v.video_url && 
      !v.video_url.includes('remotionlambda') && 
      !v.video_url.includes('aiaio3-public-videos')
    );

    console.log('\n📈 Migration Status:');
    console.log(`   🔄 Need Migration (Remotion): ${remotionVideos.length}`);
    console.log(`   ✅ Already Migrated: ${alreadyMigrated.length}`);
    console.log(`   📹 Other Sources: ${otherVideos.length}`);

    if (remotionVideos.length > 0) {
      console.log('\n🎯 Videos needing migration:');
      remotionVideos.forEach((video, index) => {
        console.log(`   ${index + 1}. ${video.child_name} - ${video.template_type}`);
        console.log(`      ID: ${video.id}`);
        console.log(`      URL: ${video.video_url}`);
        console.log(`      Created: ${new Date(video.created_at).toLocaleDateString()}`);
        console.log();
      });
    }

    return {
      needMigration: remotionVideos,
      alreadyMigrated,
      otherVideos,
      total: videos.length
    };

  } catch (error) {
    console.error('❌ Error finding videos:', error);
    throw error;
  }
}

async function migrateVideo(video) {
  try {
    console.log(`🔄 Migrating video: ${video.child_name} - ${video.template_type}`);
    
    // Extract render ID and filename from URL
    const urlParts = video.video_url.split('/');
    const renderId = urlParts[urlParts.length - 2];
    const fileName = urlParts[urlParts.length - 1];
    
    console.log(`   📁 Source: renders/${renderId}/${fileName}`);
    
    // Create organized path in public bucket
    const videoDate = new Date(video.created_at);
    const year = videoDate.getFullYear();
    const month = String(videoDate.getMonth() + 1).padStart(2, '0');
    const day = String(videoDate.getDate()).padStart(2, '0');
    
    const cleanChildName = video.child_name.replace(/[^a-zA-Z0-9]/g, '');
    const newKey = `approved-videos/${year}/${month}/${day}/${video.id}-${cleanChildName}-${fileName}`;
    
    console.log(`   📤 Destination: ${newKey}`);
    
    // Check if source file exists
    const copyCommand = new CopyObjectCommand({
      CopySource: `remotionlambda-useast1-3pwoq46nsa/renders/${renderId}/${fileName}`,
      Bucket: 'aiaio3-public-videos',
      Key: newKey,
      MetadataDirective: 'REPLACE',
      Metadata: {
        'original-url': video.video_url,
        'video-id': video.id,
        'child-name': video.child_name,
        'template-type': video.template_type,
        'migrated-date': new Date().toISOString(),
        'migration-type': 'manual-batch'
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
            migrationType: 'manual-batch'
          }
        }
      })
      .eq('id', video.id);

    if (updateError) {
      throw updateError;
    }
    
    console.log(`   💾 Database updated`);
    console.log(`   🎉 Migration complete!\n`);
    
    return {
      success: true,
      videoId: video.id,
      originalUrl: video.video_url,
      newUrl: publicUrl
    };
    
  } catch (error) {
    console.error(`   ❌ Migration failed for ${video.child_name}:`, error.message);
    return {
      success: false,
      videoId: video.id,
      error: error.message
    };
  }
}

async function migrateAllPublishedVideos() {
  try {
    const analysis = await findPublishedVideosNeedingMigration();
    
    if (analysis.needMigration.length === 0) {
      console.log('🎉 No videos need migration! All approved videos are already migrated.');
      return;
    }
    
    console.log(`\n🚀 Starting migration of ${analysis.needMigration.length} videos...\n`);
    
    const results = [];
    
    for (let i = 0; i < analysis.needMigration.length; i++) {
      const video = analysis.needMigration[i];
      console.log(`[${i + 1}/${analysis.needMigration.length}]`);
      
      const result = await migrateVideo(video);
      results.push(result);
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successful.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log('\n❌ Failed migrations:');
      failed.forEach(f => {
        console.log(`   - Video ID: ${f.videoId} - ${f.error}`);
      });
    }
    
    if (successful.length > 0) {
      console.log('\n✅ Successfully migrated videos are now served from CDN!');
    }
    
  } catch (error) {
    console.error('❌ Migration process failed:', error);
  }
}

// Run the migration
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--analyze-only')) {
    findPublishedVideosNeedingMigration()
      .then(() => console.log('\n🔍 Analysis complete!'))
      .catch(console.error);
  } else {
    migrateAllPublishedVideos();
  }
}

module.exports = { findPublishedVideosNeedingMigration, migrateAllPublishedVideos };
