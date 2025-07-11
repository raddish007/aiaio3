import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import VideoHeader from '@/components/VideoHeader';
import VideoFooter from '@/components/VideoFooter';

interface Video {
  id: string;
  title: string;
  video_url: string;
  duration?: number;
}

export default function VideoPlayback() {
  const router = useRouter();
  const { id, title } = router.query;
  const [video, setVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (id && title) {
      const videoData: Video = {
        id: id as string,
        title: decodeURIComponent(title as string),
        video_url: '/sample-video-1.mp4',
        duration: 180,
      };
      setVideo(videoData);
      setLoading(false);
    }
  }, [id, title]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
    const handleLoadedMetadata = () => setDuration(videoElement.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    if (isPlaying) videoElement.pause();
    else videoElement.play();
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const newTime = parseFloat(e.target.value);
    videoElement.currentTime = newTime;
    setCurrentTime(newTime);
  };
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  const handleBack = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
  };
  const handleNext = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 10);
  };
  const handleHome = () => router.push('/video-library');

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-yellow/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-yellow mx-auto"></div>
          <p className="mt-4 text-brand-purple text-lg font-semibold">Loading video...</p>
        </div>
      </div>
    );
  }
  if (!video) {
    return (
      <div className="min-h-screen bg-brand-yellow/10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-brand-purple text-lg font-semibold">Video not found</p>
          <button
            onClick={handleHome}
            className="mt-4 btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  return (
    <>
      <Head>
        <title>{video.title} - Nolan's Videos</title>
        <meta name="description" content={`Watch ${video.title}`} />
      </Head>
      <div className="min-h-screen bg-brand-yellow/10 flex flex-col">
        <VideoHeader 
          title={video.title}
          showBackButton={true}
          onBackClick={handleHome}
        />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-6 mb-8 shadow-card border-4 border-brand-yellow">
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
              <video
                ref={videoRef}
                className="w-full h-full"
                preload="metadata"
                controls={false}
              >
                <source src={video.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {/* Play Button Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <button
                    onClick={togglePlay}
                    className="play-button"
                  >
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="18" cy="18" r="18" fill="#FFB200"/>
                      <polygon points="14,11 27,18 14,25" fill="#640D5F"/>
                    </svg>
                  </button>
                </div>
              )}
              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-3 bg-brand-yellow/30 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #FFB200 0%, #FFB200 ${(currentTime / (duration || 1)) * 100}%, #6b7280 ${(currentTime / (duration || 1)) * 100}%, #6b7280 100%)`
                  }}
                />
                <div className="flex justify-between text-white text-sm mt-3 font-semibold">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
            <button
              onClick={togglePlay}
              className="btn-primary"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">{isPlaying ? '⏸' : '▶'}</div>
                <div className="text-sm font-bold">{isPlaying ? 'Pause' : 'Play'}</div>
              </div>
            </button>
            <button
              onClick={handleBack}
              className="btn-secondary"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">⏪</div>
                <div className="text-sm font-bold">Back</div>
              </div>
            </button>
            <button
              onClick={handleNext}
              className="btn-secondary"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">⏩</div>
                <div className="text-sm font-bold">Next</div>
              </div>
            </button>
            <button
              onClick={handleHome}
              className="btn-secondary"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">🏠</div>
                <div className="text-sm font-bold">Home</div>
              </div>
            </button>
          </div>
        </main>
        <VideoFooter />
      </div>
    </>
  );
} 