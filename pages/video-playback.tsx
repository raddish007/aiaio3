import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import VideoPlaybackContent from '@/components/VideoPlaybackContent';

export default function VideoPlayback() {
  const router = useRouter();
  const { videoId, childId } = router.query;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleBackClick = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Image
                src="/HippoPolkaLogo.png"
                alt="Hippo and Dog Logo"
                width={60}
                height={60}
                priority
                className="flex-shrink-0"
              />
              <h1 className="text-xl sm:text-2xl font-bold text-black truncate">Hippo Polka Beta</h1>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/account-management"
                className="text-black hover:text-gray-600 transition-colors text-sm sm:text-base"
              >
                Account Settings
              </Link>
              <button
                onClick={handleLogout}
                className="text-black hover:text-gray-600 transition-colors text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <VideoPlaybackContent
        videoId={videoId as string}
        childId={childId as string}
        isDemo={false}
        onBackClick={handleBackClick}
      />
    </div>
  );
} 