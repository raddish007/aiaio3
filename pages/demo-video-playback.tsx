import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import VideoPlaybackContent from '@/components/VideoPlaybackContent';

// Child ID to name mapping for demo
const CHILD_NAMES = {
  '2d1db6d7-06da-430e-ab27-1886913eb469': 'Nolan',
  '6a248ddf-fdf0-4645-9a80-e82bf7672d70': 'Lorelei',
  '87109f4e-c10c-4400-a838-0cffad09b0a5': 'Andrew'
};

// Child ID to icon mapping for demo
const CHILD_ICONS = {
  '2d1db6d7-06da-430e-ab27-1886913eb469': '/icon_dinosaur.png',
  '6a248ddf-fdf0-4645-9a80-e82bf7672d70': '/icon_cat.png',
  '87109f4e-c10c-4400-a838-0cffad09b0a5': '/icon_rocket.png'
};

// Child ID to parent resources mapping for demo
const PARENT_RESOURCES = {
  '2d1db6d7-06da-430e-ab27-1886913eb469': '/parent-resources-nolan',
  '6a248ddf-fdf0-4645-9a80-e82bf7672d70': '/parent-resources-lorelei',
  '87109f4e-c10c-4400-a838-0cffad09b0a5': '/parent-resources-andrew'
};

export default function DemoVideoPlayback() {
  const router = useRouter();
  const { videoId, childId } = router.query;
  
  const childName = childId ? CHILD_NAMES[childId as keyof typeof CHILD_NAMES] : 'Child';
  const childIcon = childId ? CHILD_ICONS[childId as keyof typeof CHILD_ICONS] : '/icon_dinosaur.png';
  const parentResourcesUrl = childId ? PARENT_RESOURCES[childId as keyof typeof PARENT_RESOURCES] : '/parent-resources-nolan';

  const handleBackClick = () => {
    // Navigate back to the appropriate demo page based on childId
    if (childId === '2d1db6d7-06da-430e-ab27-1886913eb469') {
      router.push('/demo-nolan');
    } else if (childId === '6a248ddf-fdf0-4645-9a80-e82bf7672d70') {
      router.push('/demo-lorelei');
    } else if (childId === '87109f4e-c10c-4400-a838-0cffad09b0a5') {
      router.push('/demo-andrew');
    } else {
      router.push('/demo-nolan'); // fallback
    }
  };

  return (
    <>
      <Head>
        <title>{childName}'s Learning Videos - Demo</title>
        <meta name="description" content={`Personalized learning videos for ${childName}`} />
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
                  href={parentResourcesUrl}
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
                    value={childId === '2d1db6d7-06da-430e-ab27-1886913eb469' ? '/demo-nolan' : 
                           childId === '6a248ddf-fdf0-4645-9a80-e82bf7672d70' ? '/demo-lorelei' : 
                           childId === '87109f4e-c10c-4400-a838-0cffad09b0a5' ? '/demo-andrew' : '/demo-nolan'}
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
        <main>
          <div className="mb-8 flex items-center space-x-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            {/* Profile Icon */}
            <img 
              src={childIcon}
              alt={`${childName}'s Profile`}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{childName}</h2>
              <p className="text-gray-600 text-lg">
                Watch {childName}'s custom videos designed to help with letter recognition, name learning, and early literacy skills.
              </p>
            </div>
          </div>

          {/* Video Playback Content */}
          <VideoPlaybackContent
            videoId={videoId as string}
            childId={childId as string}
            isDemo={true}
            demoChildName={childName}
            onBackClick={handleBackClick}
          />
        </main>
      </div>
    </>
  );
} 