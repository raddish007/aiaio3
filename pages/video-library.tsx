import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import VideoHeader from '@/components/VideoHeader';
import VideoFooter from '@/components/VideoFooter';
import VideoCard from '@/components/VideoCard';

interface Video {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  thumbnail_url?: string;
  video_url: string;
  created_at: string;
}

export default function VideoLibrary() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      // For demo purposes, we'll create some sample videos
      const sampleVideos: Video[] = [
        {
          id: '1',
          title: "Bunnies on the Moon | Sunny Bunnies",
          description: '',
          duration: 208,
          thumbnail_url: 'https://cdn.sensical.tv/thumbnails/bunnies-moon.jpg',
          video_url: '/sample-video-1.mp4',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: "Bubbles | Sunny Bunnies",
          description: '',
          duration: 215,
          thumbnail_url: 'https://cdn.sensical.tv/thumbnails/bubbles.jpg',
          video_url: '/sample-video-2.mp4',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          title: "Franklin and the Baby / Franklin",
          description: '',
          duration: 1372,
          thumbnail_url: 'https://cdn.sensical.tv/thumbnails/franklin-baby.jpg',
          video_url: '/sample-video-3.mp4',
          created_at: new Date().toISOString(),
        },
      ];
      setVideos(sampleVideos);
    } catch (error) {
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    router.push(`/video-playback?id=${video.id}&title=${encodeURIComponent(video.title)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-yellow/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-yellow mx-auto"></div>
          <p className="mt-4 text-brand-purple text-lg font-semibold">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-yellow/10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-brand-purple text-lg font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Nolan's Videos</title>
        <meta name="description" content="Watch your personalized videos" />
      </Head>
      <div className="min-h-screen bg-brand-yellow/10 flex flex-col">
        <VideoHeader title="Nolan's Videos" />
        <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
          <div className="playlist-title">Spotlight Playlist</div>
          <div className="flex gap-6 overflow-x-auto pb-2">
            {videos.map((video) => (
              <div key={video.id} className="min-w-[260px] max-w-[320px] w-full">
                <VideoCard video={video} onClick={handleVideoClick} />
              </div>
            ))}
          </div>
        </main>
        <VideoFooter />
      </div>
    </>
  );
} 