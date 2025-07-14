import React, { useState, useRef, useEffect } from 'react';
import { useOptimizedVideoUrl } from '@/hooks/useOptimizedVideo';

interface Video {
  id: string;
  title: string;
  type: 'individual' | 'episode';
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  created_at: string;
  metadata?: any;
}

interface VideoPlayerProps {
  video: Video;
  className?: string;
  autoPlay?: boolean;
}

export default function VideoPlayer({ video, className = "", autoPlay = false }: VideoPlayerProps) {
  const optimizedVideoUrl = useOptimizedVideoUrl(video.video_url); // 🚀 CDN optimization
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setIsLoading(false);
      if (autoPlay) {
        videoElement.play().catch(console.error);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleLoadStart = () => setIsLoading(true);

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('loadstart', handleLoadStart);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('loadstart', handleLoadStart);
    };
  }, []);

  // Reset loading state when video URL changes
  useEffect(() => {
    setIsLoading(true);
    setIsBuffering(false);
  }, [optimizedVideoUrl]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const newTime = parseFloat(e.target.value);
    videoElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    // Hide controls after 3 seconds of no movement
    setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleTouch = () => {
    setShowControls(true);
    // Hide controls after 4 seconds on mobile for easier interaction
    setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000);
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-xl overflow-hidden shadow-lg ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={handleTouch}
      onTouchEnd={handleTouch}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        preload="metadata"
        poster={video.thumbnail_url}
      >
        <source src={optimizedVideoUrl} type="video/mp4" />
        <source src={optimizedVideoUrl} type="video/webm" />
        <source src={optimizedVideoUrl} type="video/ogg" />
        Your browser does not support the video tag.
      </video>

      {/* Loading/Buffering Spinner Overlay */}
      {(isLoading || isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="relative">
            {/* Minimalist spinning circle */}
            <div className="w-16 h-16 border-4 border-white/30 rounded-full animate-spin border-t-white"></div>
            {/* Inner dot for extra visual interest */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="group bg-white/90 backdrop-blur-sm rounded-full p-4 sm:p-8 hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-black ml-1 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 sm:p-6 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4 sm:mb-8">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, white 0%, white ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-8">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full p-2 sm:p-3 transition-all duration-200 transform hover:scale-105"
            >
              {isPlaying ? (
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Time Display */}
            <div className="bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-1">
              <span className="text-white text-xs sm:text-sm font-medium tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Volume Control - Hide on small screens */}
            <div className="hidden sm:flex items-center space-x-3 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer volume-slider"
              />
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full p-2 sm:p-3 transition-all duration-200 transform hover:scale-105"
            >
              {isFullscreen ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Video Title - Only show on hover */}
      <div className={`absolute top-3 sm:top-6 left-3 sm:left-6 transition-opacity ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        <h3 className="text-white text-base sm:text-xl font-bold drop-shadow-lg bg-black/50 px-3 py-1 sm:px-4 sm:py-2 rounded-lg">
          {video.title}
        </h3>
      </div>

      {/* Custom CSS for slider styling */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        
        .volume-slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
} 