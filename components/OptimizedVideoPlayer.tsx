import React from 'react';
import { useOptimizedVideoUrl } from '@/hooks/useOptimizedVideo';

interface OptimizedVideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  style?: React.CSSProperties;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onLoadedData?: () => void;
  onError?: (error: any) => void;
  useCloudFront?: boolean;
}

/**
 * Video player component that automatically uses CloudFront CDN for optimized delivery
 */
export const OptimizedVideoPlayer: React.FC<OptimizedVideoPlayerProps> = ({
  src,
  poster,
  className = '',
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  preload = 'metadata',
  style,
  onLoadStart,
  onCanPlay,
  onLoadedData,
  onError,
  useCloudFront = true,
  ...props
}) => {
  const optimizedSrc = useOptimizedVideoUrl(src, useCloudFront);
  const optimizedPoster = useOptimizedVideoUrl(poster || '', useCloudFront && !!poster);

  const handleError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video playback error:', event);
    if (onError) {
      onError(event);
    }
  };

  return (
    <video
      src={optimizedSrc}
      poster={optimizedPoster || undefined}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      preload={preload}
      style={style}
      onLoadStart={onLoadStart}
      onCanPlay={onCanPlay}
      onLoadedData={onLoadedData}
      onError={handleError}
      {...props}
    >
      Your browser does not support the video tag.
    </video>
  );
};

export default OptimizedVideoPlayer;
