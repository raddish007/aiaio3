import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';

interface Child {
  id: string;
  name: string;
  age: number;
  primary_interest: string;
  profile_photo_url: string | null;
  parent_id: string;
  created_at: string | null;
  updated_at: string | null;
  metadata: any;
}

interface Video {
  id: string;
  title: string;
  description: string;
  parent_tip: string;
  display_image: string;
  video_url: string;
  publish_date: string;
  personalization_level: string;
  child_theme: string;
  duration_seconds?: number;
  metadata?: any;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadChildVideos(selectedChild.id);
    }
  }, [selectedChild]);

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);
    await loadChildren(user.id);
  };

  const loadChildren = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId)
        .order('name');

      if (error) {
        console.error('Error loading children:', error);
        return;
      }

      const childrenData = data || [];
      setChildren(childrenData);
      
      // Set the first child as selected
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChildVideos = async (childId: string) => {
    setVideosLoading(true);
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      // Fetch the playlist for this child
      const { data, error } = await supabase
        .from('child_playlists')
        .select('videos')
        .eq('child_id', childId)
        .single();
      if (error) {
        throw error;
      }
      setVideos(data?.videos || []);
    } catch (error) {
      console.error('Error fetching child videos:', error);
      setVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
    return emojis[interest] || '👶';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPersonalizationBadge = (level: string) => {
    const badges = {
      child_specific: { text: 'Personal', color: 'bg-blue-100 text-blue-800' },
      theme_specific: { text: 'Theme', color: 'bg-green-100 text-green-800' },
      generic: { text: 'General', color: 'bg-gray-100 text-gray-800' }
    };
    return badges[level as keyof typeof badges] || badges.generic;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Image
                  src="/HippoPolkaLogo.png"
                  alt="Hippo and Dog Logo"
                  width={60}
                  height={60}
                  priority
                />
                <h1 className="text-2xl font-bold text-black">Hippo Polka Beta</h1>
              </div>
              <div className="flex items-center space-x-4">
                {children.length > 1 && (
                  <select
                    value={selectedChild?.id || ''}
                    onChange={(e) => {
                      const child = children.find(c => c.id === e.target.value);
                      setSelectedChild(child || null);
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2 text-black bg-white"
                  >
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                )}
                <Link
                  href="/account-management"
                  className="text-black hover:text-gray-600 transition-colors"
                >
                  Account Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-black hover:text-gray-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white">
          {/* Child Display */}
          {selectedChild && (
            <div className="mb-8">
              <div className="flex items-center space-x-4">
                {(selectedChild.metadata?.icon) ? (
                  <Image
                    src={`/${selectedChild.metadata.icon}`}
                    alt={`${selectedChild.name}'s icon`}
                    width={60}
                    height={60}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-15 h-15 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-3xl">{getInterestEmoji(selectedChild.primary_interest)}</span>
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-black">{selectedChild.name}</h2>
                  <p className="text-gray-600">Age {selectedChild.age} • {selectedChild.primary_interest}</p>
                </div>
              </div>
            </div>
          )}

          {/* Video Gallery */}
          {children.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-black">Video Gallery</h3>
              </div>
              {videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {videos.map((video) => {
                    const badge = getPersonalizationBadge(video.personalization_level);
                    return (
                      <div
                        key={video.id}
                        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 flex flex-col cursor-pointer hover:shadow-2xl transition-shadow"
                        onClick={() => router.push({
                          pathname: '/video-playback',
                          query: { videoId: video.id, childId: selectedChild?.id }
                        })}
                      >
                        <div className="relative" style={{ aspectRatio: '16/9' }}>
                          <img
                            src={video.display_image}
                            alt={video.title}
                            className="object-cover w-full h-full"
                          />
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-full">
                              {badge.text}
                            </span>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {video.duration_seconds ? formatDuration(video.duration_seconds) : ''}
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h4 className="font-semibold text-black mb-2 line-clamp-2">{video.title}</h4>
                          {video.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{video.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !videosLoading ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📺</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No videos available yet</h3>
                  <p className="text-gray-600">Videos will appear here once they're generated and approved.</p>
                </div>
              ) : null}
            </div>
          )}

          {/* No Children State */}
          {children.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👶</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No children found</h3>
              <p className="text-gray-600">Add a child to get started.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 