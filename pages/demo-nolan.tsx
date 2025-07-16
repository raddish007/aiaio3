import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface Video {
  id: string;
  title: string;
  file_url: string;
  thumbnail_url?: string;
  description?: string;
  created_at: string;
  duration_seconds?: number;
  parent_tip?: string;
}

export default function DemoNolanPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchNolanVideos();
  }, []);

  const fetchNolanVideos = async () => {
    try {
      setLoading(true);
      // Get Nolan's playlist from child_playlists table
      const { data: playlistData, error: playlistError } = await supabase
        .from('child_playlists')
        .select('videos, updated_at')
        .eq('child_id', '2d1db6d7-06da-430e-ab27-1886913eb469')
        .single();

      if (playlistError) {
        console.error('Error fetching playlist:', playlistError);
        setError('Failed to load playlist');
        return;
      }

      if (playlistData && playlistData.videos) {
        // Extract videos from the playlist
        const playlistVideos = playlistData.videos.map((video: any) => ({
          id: video.id,
          title: video.title,
          file_url: video.video_url,
          thumbnail_url: video.display_image,
          description: video.description,
          created_at: video.publish_date || video.created_at,
          duration_seconds: video.duration_seconds,
          parent_tip: video.parent_tip
        }));
        setVideos(playlistVideos);
      } else {
        setVideos([]);
      }
    } catch (err) {
      console.error('Error fetching Nolan videos:', err);
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Nolan's Learning Videos - Demo</title>
        <meta name="description" content="Personalized learning videos for Nolan" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-3">
                <img 
                  src="/HippoPolkaLogo.png" 
                  alt="Hippo Polka" 
                  className="h-12 w-12"
                />
                <span className="text-2xl font-bold text-gray-900">Hippo Polka</span>
              </div>
              
              {/* Navigation */}
              <nav className="flex items-center space-x-4 sm:space-x-6">
                <Link 
                  href="/parent-resources-nolan" 
                  className="text-gray-600 hover:text-gray-900 font-medium text-sm sm:text-base"
                >
                  Parent Resources
                </Link>
                
                <div className="relative">
                  <select 
                    className="bg-white border border-gray-300 rounded-md px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] sm:min-w-[160px]"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      if (selectedValue && selectedValue !== router.pathname) {
                        router.push(selectedValue);
                      }
                    }}
                    value="/demo-nolan"
                  >
                    <option value="/demo-andrew" style={{ fontFamily: 'Poppins, sans-serif' }}>Andrew</option>
                    <option value="/demo-lorelei" style={{ fontFamily: 'Poppins, sans-serif' }}>Lorelei</option>
                    <option value="/demo-nolan" style={{ fontFamily: 'Poppins, sans-serif' }}>Nolan</option>
                  </select>
                </div>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center space-x-4">
            {/* Profile Icon */}
            <img 
              src="/icon_dinosaur.png" 
              alt="Nolan's Profile" 
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Nolan</h2>
              <p className="text-gray-600 text-lg">
                Watch Nolan's custom videos designed to help with letter recognition, name learning, and early literacy skills.
              </p>
            </div>
          </div>

          {/* Videos Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchNolanVideos}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No videos available for Nolan yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div 
                  key={video.id} 
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => router.push({
                    pathname: '/demo-video-playback',
                    query: { videoId: video.id, childId: '2d1db6d7-06da-430e-ab27-1886913eb469' }
                  })}
                >
                  <div className="aspect-video bg-gray-100 relative">
                    {video.thumbnail_url ? (
                      <>
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    )}
                    
                    {/* Duration badge */}
                    {video.duration_seconds && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                        {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{video.title}</h3>
                    {video.description && (
                      <p className="text-gray-600 text-sm">{video.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
