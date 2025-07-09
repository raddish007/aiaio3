import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import VideoPlayer from '@/components/VideoPlayer';

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  created_at: string;
}

interface Video {
  id: string;
  title: string;
  type: 'individual' | 'episode';
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  created_at: string;
  metadata?: any;
}

interface Episode {
  id: string;
  episode_number: number;
  delivery_date: string;
  status: string;
  segments?: Video[];
}

export default function ChildVideos() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [individualVideos, setIndividualVideos] = useState<Video[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildVideos(selectedChild.id);
    }
  }, [selectedChild]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    fetchChildren(user.id);
  };

  const fetchChildren = async (userId: string) => {
    try {
      const { data: childrenData, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId);

      if (error) {
        console.error('Error fetching children:', error);
        setError('Failed to load children');
        return;
      }

      if (childrenData && childrenData.length > 0) {
        setChildren(childrenData);
        setSelectedChild(childrenData[0]); // Select first child by default
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setError('Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildVideos = async (childId: string) => {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`/api/videos/list?childId=${childId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      
      setIndividualVideos(data.individualVideos);
      setEpisodes(data.episodes);

    } catch (error) {
      console.error('Error fetching child videos:', error);
      setError('Failed to load videos');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  const getInterestEmoji = (interest: string) => {
    const emojis: { [key: string]: string } = {
      halloween: '🎃',
      space: '🚀',
      animals: '🐾',
      vehicles: '🚗',
      dinosaurs: '🦕',
      princesses: '👑',
      superheroes: '🦸‍♂️',
      nature: '🌿',
    };
    return emojis[interest] || '🎬';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading your videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">😢</div>
          <p className="text-gray-600 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
        <title>Videos - AIAIO</title>
        <meta name="description" content="Watch your personalized videos" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToDashboard}
                  className="text-gray-600 hover:text-blue-600 text-sm"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-blue-600">AIAIO Videos</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user?.user_metadata?.name || 'Parent'}!</span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-blue-600"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Child Selection */}
          {children.length > 1 && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Child</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      selectedChild?.id === child.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="text-3xl mr-3">
                        {getInterestEmoji(child.primary_interest)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{child.name}</h3>
                        <p className="text-sm text-gray-600">
                          {child.age} year{child.age !== 1 ? 's' : ''} old • {child.primary_interest}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedChild && (
            <>
              {/* Welcome Section */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <div className="flex items-center">
                  <div className="text-4xl mr-4">
                    {getInterestEmoji(selectedChild.primary_interest)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Videos for {selectedChild.name}
                    </h2>
                    <p className="text-gray-600">
                      Watch your personalized videos and weekly episodes!
                    </p>
                  </div>
                </div>
              </div>

              {/* Video Player */}
              {selectedVideo && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedVideo.title}</h3>
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="text-gray-500 hover:text-red-500 text-2xl transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-w-2xl mx-auto">
                    <VideoPlayer video={selectedVideo} className="aspect-video" />
                  </div>
                </div>
              )}

              {/* Individual Videos */}
              {individualVideos.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Special Videos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {individualVideos.map((video) => (
                      <div
                        key={video.id}
                        className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all transform hover:scale-105 border-2 border-transparent hover:border-blue-300"
                        onClick={() => setSelectedVideo(video)}
                      >
                        <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
                          <div className="text-6xl text-blue-500">▶️</div>
                          <div className="absolute top-3 right-3 bg-white/80 rounded-full px-2 py-1">
                            <span className="text-xs font-semibold text-gray-700">
                              {video.duration && formatDuration(video.duration)}
                            </span>
                          </div>
                        </div>
                        <div className="p-5">
                          <h4 className="font-bold text-gray-900 text-lg mb-2">{video.title}</h4>
                          <p className="text-sm text-gray-600">
                            Click to watch! 🎬
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Episodes */}
              {episodes.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Weekly Episodes</h3>
                  <div className="space-y-4">
                    {episodes.map((episode) => (
                      <div
                        key={episode.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          // TODO: Implement episode player
                          console.log('Episode clicked:', episode);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">📺</div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Episode {episode.episode_number}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Delivered {new Date(episode.delivery_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-gray-400">▶️</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Videos Message */}
              {individualVideos.length === 0 && episodes.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <div className="text-6xl mb-4">🎬</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No videos yet for {selectedChild.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Your personalized videos are being created! Check back soon.
                  </p>
                  <button
                    onClick={handleBackToDashboard}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
} 