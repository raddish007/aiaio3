import React, { useState } from 'react';
import Head from 'next/head';
import VideoPlayer from '@/components/VideoPlayer';

export default function TestVideoPlayer() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const testVideos = [
    {
      id: '1',
      title: 'Test Video 1',
      type: 'individual' as const,
      video_url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Test Video 2',
      type: 'individual' as const,
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      created_at: new Date().toISOString(),
    }
  ];

  return (
    <>
      <Head>
        <title>Test Video Player - AIAIO</title>
        <meta name="description" content="Test video player functionality" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Video Player Test</h1>
          
          {/* Video Player */}
          {selectedVideo && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{selectedVideo.title}</h2>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕ Close
                </button>
              </div>
              <VideoPlayer video={selectedVideo} className="aspect-video" />
            </div>
          )}

          {/* Video List */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedVideo(video)}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
                  <p className="text-sm text-gray-600">Click to play</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 