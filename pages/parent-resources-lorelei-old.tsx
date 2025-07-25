import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface ChildVideo {
  id: string;
  video_title: string;
  consumer_title?: string;
  consumer_description?: string;
  template_type: string;
  video_url: string;
  display_image_url?: string;
  is_published: boolean;
}

export default function ParentResourcesLoreleiPage() {
  const [videos, setVideos] = useState<ChildVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoreleiVideos();
  }, []);

  const fetchLoreleiVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('child_approved_videos')
        .select('id, video_title, consumer_title, consumer_description, template_type, video_url, display_image_url, is_published')
        .eq('child_name', 'Lorelei')
        .eq('approval_status', 'approved')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Lorelei\'s videos:', error);
      } else {
        setVideos(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExtensionIdeasForVideo = (video: ChildVideo) => {
    switch (video.template_type) {
      case 'letter-hunt':
        return {
          title: "Lorelei's Letter Hunt",
          description: "Visual recognition of letters in different settings",
          activity: "Look for Lorelei's special letters in cat-themed books, gentle story illustrations, or around the house. Each time Lorelei finds one, do a gentle \"cat stretch\" together! This builds Lorelei's recognition across contexts while honoring her love of cats and quiet activities.",
          videoLink: video.video_url
        };
      case 'name-video':
        return {
          title: "Lorelei's Name Song",
          description: "Letter identification and name recognition",
          activity: "Create a beautiful name display with Lorelei using cat stickers or drawings around each letter of \"LORELEI.\" Seeing her name decorated with things she loves builds both print awareness and personal connection to reading.",
          videoLink: video.video_url
        };
      case 'lullaby':
        return {
          title: "Lorelei's Sleepy Song",
          description: "Language patterns, routines, emotional connection",
          activity: "As part of Lorelei's bedtime routine, create a gentle \"goodnight\" ritual—\"Goodnight, little kitten,\" \"Goodnight, soft blanket,\" \"Goodnight, sweet Lorelei.\" The predictable, soothing pattern helps build language memory in a way that matches her gentle nature.",
          videoLink: video.video_url
        };
      default:
        return {
          title: `Lorelei's ${video.consumer_title || video.video_title}`,
          description: "Learning through gentle play and exploration",
          activity: "After watching this video with Lorelei, extend the learning through quiet, creative activities that match her personality. Encourage her to share her thoughts and feelings about what she noticed, honoring her thoughtful nature.",
          videoLink: video.video_url
        };
    }
  };
  return (
    <>
      <Head>
        <title>Parent Resources for Lorelei - Supporting Your Child's Early Literacy</title>
        <meta name="description" content="Personalized resources and tips for supporting Lorelei's early literacy development" />
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
                  className="h-12 w-12"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Parent Resources for Lorelei</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <img 
                      src="/icon_cat.png" 
                      alt="Lorelei's Profile" 
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-600">Lorelei's Learning Journey</span>
                  </div>
                </div>
              </div>
              
              <nav className="flex items-center space-x-6">
                <Link 
                  href="/demo-lorelei" 
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Back to Lorelei's Videos
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="prose max-w-none">
            <h1 className="text-4xl font-bold text-black mb-8">Supporting Lorelei's Early Literacy</h1>
            
            <p className="text-lg text-black leading-relaxed mb-6">
              Helping Lorelei learn to read doesn't mean flashcards or long lessons—it means noticing letters in her favorite cat books, singing her name while she plays, and turning everyday moments into joyful, shared experiences. The foundation of literacy is built through connection, repetition, and play, especially in the early years.
            </p>

            <p className="text-lg text-black leading-relaxed mb-8">
              Every video in Lorelei's series is designed to spark her curiosity, introduce foundational skills, and give you fun ways to keep the learning going long after the screen turns off.
            </p>

            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">Why Video for Lorelei?</h2>
            
            <p className="text-lg text-black leading-relaxed mb-4">
              Think of video as a starting point, not a substitute. Lorelei's short, personalized videos are designed to:
            </p>

            <ul className="list-disc pl-6 mb-6 space-y-2 text-lg text-black">
              <li>Introduce letters, words, and concepts in playful, familiar ways that connect to Lorelei's interests</li>
              <li>Connect to Lorelei's love of cats, gentle stories, and creative play</li>
              <li>Invite you to join in, pause, and build on what you see together with Lorelei</li>
            </ul>

            <p className="text-lg text-black leading-relaxed mb-8">
              The real magic happens when you bring the ideas into your everyday life with Lorelei—no special materials or prep required.
            </p>

            <h2 className="text-2xl font-bold text-black mb-6 border-b border-gray-200 pb-2">Extension Ideas for Lorelei's Videos</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading Lorelei's videos...</p>
              </div>
            ) : videos.length > 0 ? (
              <div className="space-y-8">
                {videos.map((video, index) => {
                  const extensionIdea = getExtensionIdeasForVideo(video);
                  return (
                    <div key={video.id} className="border-l-4 border-purple-500 pl-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-black">{index + 1}. {extensionIdea.title}</h3>
                        <a
                          href={extensionIdea.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                        >
                          Watch Video
                        </a>
                      </div>
                      <p className="text-base text-black mb-3">
                        <strong>What it teaches Lorelei:</strong> {extensionIdea.description}
                      </p>
                      <p className="text-base text-black mb-2"><strong>Try this with Lorelei:</strong></p>
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
                  Lorelei's personalized videos will appear here once they're created and published. 
                  Check back soon to see extension activities tailored to her specific videos!
                </p>
              </div>
            )}

            <div className="mt-12 p-6 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-base text-black leading-relaxed">
                Remember: The goal isn't perfection—it's connection. Every small moment of shared discovery builds Lorelei's confidence and love of learning. You're already doing more than you know to support Lorelei's gentle learning journey.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
