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

    // Fetch video assets from assets table
    const { data: videoAssets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .eq('type', 'video')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (assetsError) {
      console.error('Error fetching video assets:', assetsError);
    }

    // Fetch episodes
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*')
      .eq('child_id', childId)
      .eq('status', 'ready')
      .order('episode_number', { ascending: false });

    if (episodesError) {
      console.error('Error fetching episodes:', episodesError);
    }

    // Format individual videos
    const individualVideos: Array<{
      id: string;
      title: string;
      type: 'individual';
      video_url: string;
      created_at: string;
      metadata?: any;
    }> = [];
    
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

    // Add video assets (show all approved videos for now)
    if (videoAssets) {
      videoAssets.forEach(asset => {
        individualVideos.push({
          id: asset.id,
          title: asset.theme,
          type: 'individual',
          video_url: asset.file_url,
          created_at: asset.created_at,
          metadata: asset.metadata
        });
      });
    }

    // Format episodes
    const formattedEpisodes = episodes?.map(episode => ({
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