import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

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

    // First, try to get videos from the child_playlists table
    const { data: playlistData, error: playlistError } = await supabase
      .from('child_playlists')
      .select('videos, updated_at')
      .eq('child_id', childId)
      .single();

    let individualVideos: Array<{
      id: string;
      title: string;
      type: 'individual';
      video_url: string;
      created_at: string;
      metadata?: any;
    }> = [];

    if (playlistData && playlistData.videos && !playlistError) {
      // Use the curated playlist if it exists
      console.log(`Using curated playlist for child ${childId}, updated at ${playlistData.updated_at}`);
      
      individualVideos = playlistData.videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        type: 'individual' as const,
        video_url: video.video_url,
        created_at: video.publish_date || video.created_at,
        metadata: {
          ...video.metadata,
          description: video.description,
          parent_tip: video.parent_tip,
          display_image: video.display_image,
          duration_seconds: video.duration_seconds,
          personalization_level: video.personalization_level,
          child_theme: video.child_theme,
          is_published: video.is_published
        }
      }));
    } else {
      // Fallback to direct database queries if no playlist exists
      console.log(`No playlist found for child ${childId}, using direct database queries`);
      
      // Fetch individual videos from content table
      const { data: contentVideos, error: contentError } = await supabase
        .from('content')
        .select('*')
        .eq('child_id', childId)
        .eq('status', 'ready')
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false });

      if (contentError) {
        console.error('Error fetching content videos:', contentError);
      }

      // Fetch approved child videos with published assignments only
      const { data: approvedVideos, error: approvedVideosError } = await supabase
        .from('child_approved_videos')
        .select(`
          *,
          video_assignments!inner(*)
        `)
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .eq('video_assignments.child_id', childId)
        .in('video_assignments.status', ['published', 'pending'])
        .order('created_at', { ascending: false });

      if (approvedVideosError) {
        console.error('Error fetching approved videos:', approvedVideosError);
      }

      // Fetch generic/theme-specific videos with published assignments
      const { data: genericVideos, error: genericVideosError } = await supabase
        .from('child_approved_videos')
        .select(`
          *,
          video_assignments!inner(*)
        `)
        .eq('approval_status', 'approved')
        .eq('is_active', true)
        .is('video_assignments.child_id', null)
        .in('video_assignments.status', ['published', 'pending'])
        .or(`personalization_level.eq.generic,personalization_level.eq.theme_specific.and.child_theme.eq.${child.primary_interest}`)
        .order('created_at', { ascending: false });

      if (genericVideosError) {
        console.error('Error fetching generic videos:', genericVideosError);
      }
    
      // Add content videos
      if (contentVideos) {
        contentVideos.forEach(content => {
          individualVideos.push({
            id: content.id,
            title: content.title,
            type: 'individual',
            video_url: content.video_url,
            created_at: content.created_at,
            metadata: content.metadata
          });
        });
      }

      // Add approved child-specific videos
      if (approvedVideos) {
        approvedVideos.forEach(video => {
          individualVideos.push({
            id: video.id,
            title: video.video_title,
            type: 'individual',
            video_url: video.video_url,
            created_at: video.created_at,
            metadata: {
              ...video.template_data,
              personalization_level: video.personalization_level,
              child_name: video.child_name,
              child_theme: video.child_theme
            }
          });
        });
      }

      // Add generic/theme-specific videos
      if (genericVideos) {
        genericVideos.forEach(video => {
          // Avoid duplicates if child-specific version already exists
          const exists = individualVideos.some(v => v.id === video.id);
          if (!exists) {
            individualVideos.push({
              id: video.id,
              title: video.video_title,
              type: 'individual',
              video_url: video.video_url,
              created_at: video.created_at,
              metadata: {
                ...video.template_data,
                personalization_level: video.personalization_level,
                child_theme: video.child_theme
              }
            });
          }
        });
      }
    }

    // Fetch episodes (always fetch from episodes table regardless of playlist)
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .eq('child_id', childId)
      .eq('status', 'ready')
      .order('episode_number', { ascending: false });

    if (episodesError) {
      console.error('Error fetching episodes:', episodesError);
    }

    // Format episodes
    const formattedEpisodes = episodes?.map((episode: any) => ({
      id: episode.id,
      episode_number: episode.episode_number,
      delivery_date: episode.delivery_date,
      status: episode.status,
      created_at: episode.created_at
    })) || [];

    return res.status(200).json({
      individualVideos,
      episodes: formattedEpisodes,
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
        primary_interest: child.primary_interest
      }
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 