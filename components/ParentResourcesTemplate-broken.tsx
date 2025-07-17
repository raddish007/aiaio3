import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface ChildVideo {
  id: string;
  video_title: string;
  consumer_title?: string;
  consumer_description?: string;
  template_type: strin            <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-base text-black leading-relaxed">
                Remember: The goal isn't perfection—it's connection. Every small moment of shared discovery builds {childName}'s confidence and love of learning. You're already doing more than you know to support {childName}'s literacy journey.
              </p>
            </div>video_url: string;
  display_image_url?: string;
  is_published: boolean;
}

interface Child {
  id: string;
  name: string;
  primary_interest: string;
  age: number;
}

interface ParentResourcesTemplateProps {
  childName: string;
  childIcon?: string;
  demoPageLink?: string;
  themeColor?: string;
  themeDescription?: string;
}

export default function ParentResourcesTemplate({ 
  childName, 
  childIcon, 
  demoPageLink, 
  themeColor = 'blue',
  themeDescription = 'learning and exploration'
}: ParentResourcesTemplateProps) {
  const [videos, setVideos] = useState<ChildVideo[]>([]);
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildData();
  }, [childName]);

  const fetchChildData = async () => {
    try {
      // First get child info
      const { data: childData, error: childError } = await supabase
        .from('children')
        .select('id, name, primary_interest, age')
        .eq('name', childName)
        .single();

      if (childError) {
        console.error(`Error fetching ${childName}'s data:`, childError);
      } else {
        setChild(childData);
      }

      // Get videos from child_approved_videos
      const { data: videosData, error: videosError } = await supabase
        .from('child_approved_videos')
        .select('id, video_title, consumer_title, consumer_description, template_type, video_url, display_image_url, is_published')
        .eq('child_name', childName)
        .eq('approval_status', 'approved')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (videosError) {
        console.error(`Error fetching ${childName}'s videos:`, videosError);
      }

      // Get videos from child_playlists
      const { data: playlistData, error: playlistError } = await supabase
        .from('child_playlists')
        .select('videos')
        .eq('child_id', childData?.id);

      if (playlistError) {
        console.error(`Error fetching ${childName}'s playlist:`, playlistError);
      }

      // Combine videos from both sources
      let allVideos: ChildVideo[] = [];
      
      // Add videos from child_approved_videos
      if (videosData) {
        allVideos = [...videosData];
      }

      // Add videos from child_playlists
      if (playlistData && playlistData.length > 0) {
        const playlistVideos = playlistData[0]?.videos || [];
        const publishedPlaylistVideos = playlistVideos
          .filter((v: any) => v.is_published)
          .map((v: any) => ({
            id: v.id,
            video_title: v.title,
            consumer_title: v.title,
            consumer_description: v.description,
            template_type: v.title?.toLowerCase().includes('would you rather') ? 'would-you-rather' : 
                          v.title?.toLowerCase().includes('lily') ? 'positional-words' : 'general',
            video_url: v.video_url,
            display_image_url: v.display_image,
            is_published: v.is_published
          }));
        
        allVideos = [...allVideos, ...publishedPlaylistVideos];
      }

      setVideos(allVideos);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExtensionIdeasForVideo = (video: ChildVideo) => {
    const childTheme = child?.primary_interest || 'learning';
    
    switch (video.template_type) {
      case 'letter-hunt':
        return {
          title: `${childName}'s Letter Hunt`,
          description: "Visual recognition of letters in different settings",
          activity: `Look for ${childName}'s special letters in ${childTheme}-themed books, magazines, or around the house. Each time ${childName} finds one, celebrate together with a special ${childTheme} dance or sound! This builds ${childName}'s recognition across contexts, a key skill in early reading.`,
          videoLink: video.video_url
        };
      case 'name-video':
        return {
          title: `${childName}'s Name Song`,
          description: "Letter identification and name recognition",
          activity: `Create a special name display with ${childName} using ${childTheme} stickers or decorations around each letter of "${childName.toUpperCase()}." Seeing their name decorated with things they love builds both print awareness and personal connection to reading.`,
          videoLink: video.video_url
        };
      case 'lullaby':
        return {
          title: `${childName}'s Sleepy Song`,
          description: "Language patterns, routines, emotional connection",
          activity: `As part of ${childName}'s bedtime routine, create a gentle "goodnight" ritual with their favorite ${childTheme} characters or objects. The predictable pattern helps build ${childName}'s language memory and emotional security.`,
          videoLink: video.video_url
        };
      case 'would-you-rather':
        return {
          title: `${childName}'s Would You Rather Game`,
          description: "Critical thinking, language development, and decision making",
          activity: `After watching, create your own "Would You Rather" questions with ${childName}! Ask silly questions like "Would you rather have ${childTheme} ears or ${childTheme} tail?" This builds reasoning skills and vocabulary while having fun together.`,
          videoLink: video.video_url
        };
      case 'positional-words':
        return {
          title: `${childName}'s Position Play`,
          description: "Spatial awareness and vocabulary building",
          activity: `Turn this into a hands-on game! Get a box and ${childName}'s favorite ${childTheme} toy. Give directions like "Put the toy UNDER the box" or "Put it NEXT TO the box." Taking turns being the direction-giver builds ${childName}'s understanding of position words.`,
          videoLink: video.video_url
        };
      default:
        return {
          title: `${childName}'s ${video.consumer_title || video.video_title}`,
          description: `Learning through ${themeDescription}`,
          activity: `After watching this video with ${childName}, extend the learning through ${childTheme}-themed activities that match their personality. Encourage them to share their thoughts and observations.`,
          videoLink: video.video_url
        };
    }
  };

  const getThemeColorClasses = () => {
    const colorMap: { [key: string]: { border: string, bg: string, button: string, spinner: string } } = {
      blue: { border: 'border-blue-500', bg: 'bg-blue-50 border-blue-200', button: 'bg-blue-600 hover:bg-blue-700', spinner: 'border-blue-500' },
      purple: { border: 'border-purple-500', bg: 'bg-purple-50 border-purple-200', button: 'bg-purple-600 hover:bg-purple-700', spinner: 'border-purple-500' },
      orange: { border: 'border-orange-500', bg: 'bg-orange-50 border-orange-200', button: 'bg-orange-600 hover:bg-orange-700', spinner: 'border-orange-500' },
      green: { border: 'border-green-500', bg: 'bg-green-50 border-green-200', button: 'bg-green-600 hover:bg-green-700', spinner: 'border-green-500' },
      pink: { border: 'border-pink-500', bg: 'bg-pink-50 border-pink-200', button: 'bg-pink-600 hover:bg-pink-700', spinner: 'border-pink-500' },
    };
    return colorMap[themeColor] || colorMap.blue;
  };

  const colorClasses = getThemeColorClasses();

  return (
    <>
      <Head>
        <title>Parent Resources for {childName} - Supporting Your Child's Early Literacy</title>
        <meta name="description" content={`Personalized resources and tips for supporting ${childName}'s early literacy development`} />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <img 
                  src="/HippoPolkaLogo.png" 
                  alt="Hippo Polka" 
                  className="h-16 w-16"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Parent Resources for {childName}</h1>
                </div>
              </div>
              
              {demoPageLink && (
                <nav className="flex items-center space-x-6">
                  <Link 
                    href={demoPageLink} 
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Back to {childName}'s Videos
                  </Link>
                </nav>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="prose max-w-none">
            <h1 className="text-4xl font-bold text-black mb-8">Supporting {childName}'s Early Literacy</h1>
            
            <p className="text-lg text-black leading-relaxed mb-6">
              Helping {childName} learn to read doesn't mean flashcards or long lessons—it means noticing letters in their favorite books, singing their name in the car, and turning everyday moments into joyful, shared experiences. The foundation of literacy is built through connection, repetition, and play, especially in the early years.
            </p>

            <p className="text-lg text-black leading-relaxed mb-8">
              Every video in {childName}'s series is designed to spark their curiosity, introduce foundational skills, and give you fun ways to keep the learning going long after the screen turns off.
            </p>

            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">Why Video for {childName}?</h2>
            
            <p className="text-lg text-black leading-relaxed mb-4">
              Think of video as a starting point, not a substitute. {childName}'s short, personalized videos are designed to:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2 text-lg text-black">
              <li>Introduce letters, words, and concepts in playful, familiar ways that connect to {childName}'s interests</li>
              <li>Connect to {childName}'s love of {child?.primary_interest || themeDescription}</li>
              <li>Invite you to join in, pause, and build on what you see together with {childName}</li>
            </ul>

            <p className="text-lg text-black leading-relaxed mb-8">
              The real magic happens when you bring the ideas into your everyday life with {childName}—no special materials or prep required.
            </p>

            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">Extension Ideas for {childName}'s Videos</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading {childName}'s videos...</p>
              </div>
            ) : videos.length > 0 ? (
              <div className="space-y-8">
                {videos.map((video, index) => {
                  const extensionIdea = getExtensionIdeasForVideo(video);
                  return (
                    <div key={video.id} className="border-l-4 border-gray-400 pl-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-black">{index + 1}. {extensionIdea.title}</h3>
                        <a
                          href={extensionIdea.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 bg-black text-white px-3 py-1 rounded text-sm hover:bg-gray-800 transition-colors"
                        >
                          Watch Video
                        </a>
                      </div>
                      <p className="text-base text-black mb-3">
                        <strong>What it teaches {childName}:</strong> {extensionIdea.description}
                      </p>
                      <p className="text-base text-black mb-2"><strong>Try this with {childName}:</strong></p>
                      <p className="text-base text-black leading-relaxed">
                        {extensionIdea.activity}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Published Videos Yet</h3>
                <p className="text-gray-600">
                  {childName}'s personalized videos will appear here once they're created and published. 
                  Check back soon to see extension activities tailored to their specific videos!
                </p>
              </div>
            )}

            <div className={`mt-12 p-6 ${colorClasses.bg} rounded-lg`}>
              <p className="text-base text-black leading-relaxed">
                Remember: The goal isn't perfection—it's connection. Every small moment of shared discovery builds {childName}'s confidence and love of learning. You're already doing more than you know to support {childName}'s learning journey.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
