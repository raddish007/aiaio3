#!/usr/bin/env node

// Script to verify Supabase has updated CDN URLs
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSupabaseURLs() {
  try {
    console.log('🔍 Checking Supabase video URLs...\n');
    
    // Get all approved videos to see their current URLs
    const { data: videos, error } = await supabase
      .from('child_approved_videos')
      .select('id, child_name, template_type, video_url, created_at, template_data')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`📊 Found ${videos.length} approved videos\n`);

    const cdnVideos = videos.filter(v => v.video_url?.includes('aiaio3-public-videos'));
    const remotionVideos = videos.filter(v => v.video_url?.includes('remotionlambda'));
    const otherVideos = videos.filter(v => v.video_url && !v.video_url.includes('aiaio3-public-videos') && !v.video_url.includes('remotionlambda'));

    console.log('📈 URL Status Summary:');
    console.log(`   ✅ CDN URLs (aiaio3-public-videos): ${cdnVideos.length}`);
    console.log(`   🔄 Remotion URLs (still need migration): ${remotionVideos.length}`);
    console.log(`   📹 Other URLs: ${otherVideos.length}\n`);

    console.log('📋 Detailed breakdown:\n');
    
    videos.forEach((video, index) => {
      const urlType = video.video_url?.includes('aiaio3-public-videos') ? '✅ CDN' :
                     video.video_url?.includes('remotionlambda') ? '🔄 Remotion' : '📹 Other';
      
      console.log(`${index + 1}. ${video.child_name} - ${video.template_type} (${urlType})`);
      console.log(`   ID: ${video.id}`);
      console.log(`   URL: ${video.video_url}`);
      
      if (video.template_data?.migration) {
        console.log(`   📦 Migration: ${video.template_data.migration.migrationType} on ${new Date(video.template_data.migration.migratedAt).toLocaleDateString()}`);
      }
      console.log();
    });

    return {
      total: videos.length,
      cdnCount: cdnVideos.length,
      remotionCount: remotionVideos.length,
      otherCount: otherVideos.length,
      videos: videos
    };

  } catch (error) {
    console.error('❌ Error checking Supabase URLs:', error);
    throw error;
  }
}

checkSupabaseURLs();
