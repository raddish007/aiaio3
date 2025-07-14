import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { getOptimizedVideoUrlServer } from '@/lib/video-cdn';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { childId } = req.query;

    if (!childId || typeof childId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid childId' });
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify user has access to this child
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .eq('parent_id', user.id)
      .single();

    if (childError || !child) {
      return res.status(403).json({ error: 'Access denied to this child' });
    }

    // Fetch all approved, active videos with all assignments
    const { data: allVideosRaw, error: allVideosError } = await supabase
      .from('child_approved_videos')
      .select(`*, video_assignments(*)`)
      .eq('approval_status', 'approved')
      .eq('is_active', true);

    if (allVideosError) {
      console.error('Error fetching all videos:', allVideosError);
      return res.status(500).json({ error: 'Failed to fetch videos', details: allVideosError.message });
    }

    // Filter for child-specific videos (assigned to this child)
    const childSpecificVideos = (allVideosRaw || []).filter(video =>
      Array.isArray(video.video_assignments) &&
      video.video_assignments.some((a: any) => a.child_id === childId)
    );

    // Filter for general videos (assigned to all children)
    const generalVideos = (allVideosRaw || []).filter(video =>
      Array.isArray(video.video_assignments) &&
      video.video_assignments.some((a: any) => a.child_id === null)
    );

    // Filter for theme-specific videos (matching child's theme)
    const themeVideos = (allVideosRaw || []).filter(video =>
      video.personalization_level === 'theme_specific' &&
      video.child_theme === child.primary_interest
    );

    console.log('Child-specific videos:', childSpecificVideos.length);
    console.log('General videos:', generalVideos.length);
    console.log('Theme videos:', themeVideos.length);
    console.log('Child:', child);

    // Combine and deduplicate videos
    const allVideos = [
      ...childSpecificVideos,
      ...generalVideos,
      ...themeVideos
    ];
    const uniqueVideos = allVideos.filter((video, index, self) =>
      index === self.findIndex(v => v.id === video.id)
    );

    // Format videos for consumer display with CDN optimization
    const formattedVideos = uniqueVideos.map(video => {
      // Pick the assignment for this child, or general, or first available
      let assignment = (video.video_assignments || []).find((a: any) => a.child_id === childId) ||
                       (video.video_assignments || []).find((a: any) => a.child_id === null) ||
                       (video.video_assignments || [])[0];
      return {
        id: video.id,
        title: video.consumer_title || video.video_title,
        description: video.consumer_description || '',
        parent_tip: video.parent_tip || '',
        display_image: video.display_image_url || '',
        video_url: getOptimizedVideoUrlServer(video.video_url), // 🚀 CDN optimization
        publish_date: assignment?.publish_date || video.created_at,
        personalization_level: video.personalization_level,
        child_theme: video.child_theme,
        duration_seconds: video.duration_seconds,
        is_published: video.is_published,
        metadata: {
          ...video.template_data,
          assignment_metadata: assignment?.metadata || {}
        }
      };
    });

    // Sort by most recent publish date
    formattedVideos.sort((a, b) =>
      new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
    );

    return res.status(200).json({
      videos: formattedVideos,
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
        primary_interest: child.primary_interest
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard videos:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 