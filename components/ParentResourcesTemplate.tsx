import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface ChildVideo {
  id: string;
  video_title: string;
  consumer_title?: string;
  consumer_description?: string;
  parent_tip?: string;
  template_type: string;
  video_url: string;
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
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

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
        return;
      } else {
        setChild(childData);
      }

      // Get videos ONLY from child_playlists (these are the actually published videos)
      const { data: playlistData, error: playlistError } = await supabase
        .from('child_playlists')
        .select('videos')
        .eq('child_id', childData.id)
        .single();

      if (playlistError) {
        console.error(`Error fetching ${childName}'s playlist:`, playlistError);
        setVideos([]);
        return;
      }

      // Only use videos that are actually in the playlist and published
      if (playlistData && playlistData.videos) {
        const publishedVideos = playlistData.videos
          .filter((v: any) => v.is_published === true)
          .map((v: any) => ({
            id: v.id,
            video_title: v.title,
            consumer_title: v.title,
            consumer_description: v.description,
            parent_tip: v.parent_tip,
            template_type: v.title?.toLowerCase().includes('would you rather') ? 'would-you-rather' : 
                          v.title?.toLowerCase().includes('lily') ? 'positional-words' : 
                          v.title?.toLowerCase().includes('letter hunt') ? 'letter-hunt' :
                          v.title?.toLowerCase().includes('name') ? 'name-video' :
                          v.title?.toLowerCase().includes('lullaby') ? 'lullaby' : 'general',
            video_url: v.video_url,
            display_image_url: v.display_image,
            is_published: v.is_published
          }));
        
        setVideos(publishedVideos);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setVideos([]);
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
                  const isExpanded = expandedVideo === video.id;
                  
                  return (
                    <div key={video.id} className="border-l-4 border-gray-400 pl-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-black mb-2">{index + 1}. {video.consumer_title || video.video_title}</h3>
                        <p className="text-base text-black mb-3">
                          {video.consumer_description || extensionIdea.description}
                        </p>
                        
                        {/* Video Player */}
                        <div className="mb-4">
                          <div className={`transition-all duration-300 ${isExpanded ? 'w-full' : 'w-64'}`}>
                            <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
                              <video
                                className={`${isExpanded ? 'w-full aspect-video' : 'w-64 h-36'} object-cover`}
                                controls
                                preload="metadata"
                                poster={video.display_image_url}
                              >
                                <source src={video.video_url} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                              
                              {/* Expand/Collapse Button */}
                              <button
                                onClick={() => setExpandedVideo(isExpanded ? null : video.id)}
                                className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded hover:bg-black/90 transition-colors"
                                title={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* In Real Life */}
                        {video.parent_tip && (
                          <div className="mb-3">
                            <h4 className="font-semibold text-black mb-2">In Real Life</h4>
                            <p className="text-black text-base">{video.parent_tip}</p>
                          </div>
                        )}
                      </div>
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

            <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-base text-black leading-relaxed">
                Remember: The goal isn't perfection—it's connection. Every small moment of shared discovery builds {childName}'s confidence and love of learning. You're already doing more than you know to support {childName}'s literacy journey.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
