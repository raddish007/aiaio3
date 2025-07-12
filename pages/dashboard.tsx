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
  thumbnail: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Mock video data
  const mockVideos: Video[] = [
    {
      id: '1',
      title: 'Adventure in the Forest',
      description: 'Join the magical journey through the enchanted forest',
      thumbnail: '/icon_bear.png'
    },
    {
      id: '2',
      title: 'Space Explorer',
      description: 'Blast off into space with rockets and stars',
      thumbnail: '/icon_rocket.png'
    },
    {
      id: '3',
      title: 'Dinosaur Discovery',
      description: 'Learn about amazing dinosaurs from long ago',
      thumbnail: '/icon_dinosaur.png'
    },
    {
      id: '4',
      title: 'Musical Journey',
      description: 'Discover the joy of music and instruments',
      thumbnail: '/icon_guitar.png'
    },
    {
      id: '5',
      title: 'Sports Day',
      description: 'Fun activities and games for active kids',
      thumbnail: '/icon_soccer.png'
    },
    {
      id: '6',
      title: 'Art & Creativity',
      description: 'Express yourself through drawing and colors',
      thumbnail: '/icon_pencil.png'
    }
  ];

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

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
      
      // Set the oldest child as selected (first in alphabetical order)
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <h2 className="text-2xl font-bold text-black">{selectedChild.name}</h2>
            </div>
          </div>
        )}

        {/* Video Gallery - Only show if there are children */}
        {children.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-black mb-6">Video Gallery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mockVideos.map((video) => (
                <div key={video.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video relative">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-black mb-2">{video.title}</h4>
                    <p className="text-sm text-gray-600">{video.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Children State */}
        {children.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👶</span>
            </div>
            <h3 className="text-lg font-medium text-black mb-2">No children added yet</h3>
            <p className="text-gray-600 mb-6">Add your first child to get started with personalized videos</p>
            <Link
              href="/account-management"
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Add Your First Child
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 