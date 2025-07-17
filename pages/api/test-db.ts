import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testing database connection...');

    // Test the same queries used in the S3 list API
    const { data: allVideos, error: videosError } = await supabase
      .from('child_approved_videos')
      .select('id, video_url, video_title, created_at, duration_seconds, template_data, approval_status')
      .eq('approval_status', 'approved')
      .not('video_url', 'is', null);

    const { data: availableVideos, error: availableError } = await supabase
      .from('child_available_videos')
      .select('id, video_url, video_title, created_at, duration_seconds, template_data')
      .not('video_url', 'is', null);

    console.log(`📊 Database query results: ${allVideos?.length || 0} approved videos, ${availableVideos?.length || 0} available videos`);

    if (videosError) {
      console.error('Error fetching approved videos:', videosError);
    }
    if (availableError) {
      console.error('Error fetching available videos:', availableError);
    }

    // Show sample data
    const sampleVideos = allVideos?.slice(0, 3) || [];
    const sampleAvailable = availableVideos?.slice(0, 3) || [];

    res.status(200).json({
      success: true,
      approvedVideos: {
        count: allVideos?.length || 0,
        sample: sampleVideos.map(v => ({
          id: v.id,
          title: v.video_title,
          url: v.video_url
        }))
      },
      availableVideos: {
        count: availableVideos?.length || 0,
        sample: sampleAvailable.map(v => ({
          id: v.id,
          title: v.video_title,
          url: v.video_url
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error testing database:', error);
    res.status(500).json({ 
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 