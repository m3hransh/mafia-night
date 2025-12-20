'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { optimizeCloudinaryVideo, getVideoPoster } from '@/lib/cloudinary';

interface OptimizedVideoProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  lazy?: boolean;
  posterWidth?: number;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
}

/**
 * Optimized video component with:
 * - Lazy loading via Intersection Observer
 * - Responsive Cloudinary URLs
 * - Automatic poster image generation
 * - Progressive loading states
 */
export function OptimizedVideo({
  src,
  className = '',
  autoPlay = false,
  loop = false,
  muted = true,
  playsInline = true,
  preload = 'metadata',
  lazy = true,
  posterWidth = 400,
  onError,
}: OptimizedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);

  // Intersection observer for lazy loading
  const { ref: containerRef, hasBeenVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px', // Start loading 50px before entering viewport
    freezeOnceVisible: true,
  });

  // Load video when it becomes visible
  useEffect(() => {
    if (lazy && hasBeenVisible && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [lazy, hasBeenVisible, shouldLoad]);

  // Auto-load if not lazy
  useEffect(() => {
    if (!lazy) {
      setShouldLoad(true);
    }
  }, [lazy]);

  // Get optimized video URL
  const optimizedSrc = optimizeCloudinaryVideo(src);
  const posterUrl = getVideoPoster(src, posterWidth);

  const handleLoadedData = () => {
    setIsLoaded(true);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setHasError(true);
    onError?.(e);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {shouldLoad ? (
        <>
          <video
            ref={videoRef}
            src={optimizedSrc}
            poster={posterUrl}
            className={`w-full h-full object-cover ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-300`}
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            playsInline={playsInline}
            preload={preload}
            onLoadedData={handleLoadedData}
            onError={handleError}
          />
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
              <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin" />
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
      )}
    </div>
  );
}
