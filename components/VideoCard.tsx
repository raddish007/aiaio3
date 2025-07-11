import React from 'react';

interface Video {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  thumbnail_url?: string;
  video_url: string;
  created_at: string;
}

interface VideoCardProps {
  video: Video;
  onClick: (video: Video) => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="video-card cursor-pointer group"
      onClick={() => onClick(video)}
      tabIndex={0}
      role="button"
      aria-label={`Play ${video.title}`}
    >
      {/* Thumbnail with play overlay */}
      <div className="video-thumbnail aspect-video group-hover:shadow-xl transition-shadow duration-200">
        {/* Play overlay */}
        <div className="play-overlay opacity-90 group-hover:opacity-100 transition-opacity duration-200">
          <div className="play-button">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill="#FFB200"/>
              <polygon points="14,11 27,18 14,25" fill="#640D5F"/>
            </svg>
          </div>
        </div>
        {/* Duration */}
        {video.duration && (
          <span className="video-duration">{formatDuration(video.duration)}</span>
        )}
        {/* Optionally, thumbnail image */}
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover rounded-xl z-0" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-brand-yellow/30 rounded-xl z-0" />
        )}
      </div>
      {/* Video Info */}
      <div className="pt-2 pb-1 px-1">
        <div className="font-extrabold text-lg text-brand-purple leading-tight truncate" title={video.title}>
          {video.title}
        </div>
        <div className="playlist-subtitle mt-1 mb-0.5">SUNNY BUNNIES</div>
      </div>
    </div>
  );
} 