import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import VideoPlayer from '@/components/VideoPlayer';
import { getOptimizedVideoUrl } from '@/lib/video-cdn';

export default function VideoPlayback() {
  const router = useRouter();
  const { videoId, childId } = router.query;
  const [video, setVideo] = useState<any>(null);
  const [child, setChild] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (childId) {
      fetchChildAndPlaylist(childId as string);
    }
  }, [childId]);

  const fetchChildAndPlaylist = async (cid: string) => {
    setLoading(true);
    try {
      // Fetch children for header/selector
      const { data: childrenData } = await supabase
        .from('children')
        .select('*');
      setChildren(childrenData || []);
      const childObj = (childrenData || []).find((c: any) => c.id === cid);
      setChild(childObj);
      setSelectedChild(childObj);
      
      // Fetch playlist for this child (approved videos only)
      const { data, error } = await supabase
        .from('child_playlists')
        .select('videos')
        .eq('child_id', cid)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data && data.videos) {
        const videos = data.videos;
        setAllVideos(videos);
        
        const found = videos.find((v: any) => v.id === videoId);
        if (found) {
          // Optimize video URL for CDN delivery
          const optimizedVideo = {
            ...found,
            video_url: getOptimizedVideoUrl(found.video_url)
          };
          setVideo(optimizedVideo);
        } else {
          setVideo(null);
        }
      } else {
        setAllVideos([]);
        setVideo(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setVideo(null);
    } finally {
      setLoading(false);
    }
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
        {loading ? (
          <div className="text-center py-24 text-gray-500">Loading...</div>
        ) : !video ? (
          <div className="text-center py-24 text-gray-500">Video not found.</div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left side - Video Player (2/3 width on large screens, full width on smaller) */}
            <div className="w-full lg:w-2/3">
              {/* Video Player */}
              <div className="mb-6">
                <VideoPlayer video={video} className="w-full aspect-video" autoPlay={true} />
              </div>
              
              {/* Title - Left aligned */}
              <h2 className="text-2xl font-bold text-black mb-4 text-left">{video.title}</h2>
              
              {/* Description under video */}
              {video.description && (
                <p className="text-gray-700 text-base leading-relaxed text-left mb-6">
                  {video.description}
                </p>
              )}
              
              {/* Parent Tip - Below description */}
              {video.parent_tip && (
                <div className="bg-white border-2 border-black rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-black mb-3">💡 Parent Tip</h3>
                  <p className="text-black text-sm leading-relaxed">
                    {video.parent_tip}
                  </p>
                </div>
              )}
            </div>

            {/* Right side - Other Videos (1/3 width on large screens, full width on smaller) */}
            <div className="w-full lg:w-1/3">
              <h3 className="text-lg font-semibold text-black mb-4">More for {child?.name}</h3>
              <div className="space-y-3">
                {allVideos
                  .filter(v => v.id !== video.id)
                  .slice(0, 6)
                  .map((otherVideo) => (
                    <div
                      key={otherVideo.id}
                      className="group bg-white rounded-xl overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => router.push({
                        pathname: '/video-playback',
                        query: { videoId: otherVideo.id, childId: child?.id }
                      })}
                    >
                      <div className="flex gap-3 p-3">
                        <div className="relative w-20 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {otherVideo.display_image ? (
                            <>
                              <img
                                src={otherVideo.display_image}
                                alt={otherVideo.title}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                              {/* Mini play button */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                                <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  <svg className="w-3 h-3 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          )}
                          
                          {/* Duration badge */}
                          {otherVideo.duration_seconds && (
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {Math.floor(otherVideo.duration_seconds / 60)}:{String(otherVideo.duration_seconds % 60).padStart(2, '0')}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                            {otherVideo.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            {otherVideo.duration_seconds && (
                              <span>{Math.floor(otherVideo.duration_seconds / 60)} min</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {allVideos.filter(v => v.id !== video.id).length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">No other videos available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 