import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function VideoPlayback() {
  const router = useRouter();
  const { videoId, childId } = router.query;
  const [video, setVideo] = useState<any>(null);
  const [child, setChild] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (childId) {
      fetchChildAndPlaylist(childId as string);
    }
  }, [childId]);

  const fetchChildAndPlaylist = async (cid: string) => {
    setLoading(true);
    // Fetch children for header/selector
    const { data: childrenData } = await supabase
      .from('children')
      .select('*');
    setChildren(childrenData || []);
    const childObj = (childrenData || []).find((c: any) => c.id === cid);
    setChild(childObj);
    setSelectedChild(childObj);
    // Fetch playlist for this child
    const { data, error } = await supabase
      .from('child_playlists')
      .select('videos')
      .eq('child_id', cid)
      .single();
    if (data && data.videos) {
      const found = data.videos.find((v: any) => v.id === videoId);
      setVideo(found || null);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

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
                    if (child) {
                      router.replace({
                        pathname: '/video-playback',
                        query: { videoId, childId: child.id },
                      });
                    }
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-24 text-gray-500">Loading...</div>
        ) : !video ? (
          <div className="text-center py-24 text-gray-500">Video not found.</div>
        ) : (
          <>
            {/* Video Player */}
            <div className="flex justify-center mb-8">
              <video
                src={video.video_url}
                controls
                autoPlay
                className="w-full max-w-3xl h-[60vh] bg-black rounded-none shadow-none"
                style={{ objectFit: 'contain' }}
              />
            </div>
            {/* Title */}
            <h2 className="text-2xl font-bold text-black text-center mb-4">{video.title}</h2>
            {/* Parent Tip */}
            {video.parent_tip && (
              <div className="bg-blue-50 p-4 rounded text-base text-blue-800 max-w-2xl mx-auto text-center">
                <span className="font-medium">💡 Parent Tip:</span> {video.parent_tip}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 