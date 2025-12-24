import React from 'react';

/**
 * Cloudinary video optimization utilities
 * Generates responsive video URLs based on device and quality preferences
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type QualityPreset = 'low' | 'medium' | 'high' | 'auto';

interface CloudinaryOptions {
  device?: DeviceType;
  quality?: QualityPreset;
  width?: number;
  bitrate?: string;
}

const CLOUDINARY_BASE = 'https://res.cloudinary.com/m3hransh/video/upload';

// Preset configurations for different devices
const DEVICE_PRESETS = {
  mobile: {
    width: 400,
    bitrate: '300k',
    quality: 'q_auto:eco',
  },
  tablet: {
    width: 600,
    bitrate: '500k',
    quality: 'q_auto:good',
  },
  desktop: {
    width: 800,
    bitrate: '600k',
    quality: 'q_auto:good',
  },
} as const;

/**
 * Detects device type based on window width
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Optimizes a Cloudinary video URL for the current device
 * @param videoUrl - Original Cloudinary URL or path
 * @param options - Optimization options
 * @returns Optimized Cloudinary URL
 */
export function optimizeCloudinaryVideo(
  videoUrl: string,
  options: CloudinaryOptions = {}
): string {
  // If it's not a Cloudinary URL, return as-is
  if (!videoUrl.includes('cloudinary.com')) {
    return videoUrl;
  }

  const device = options.device || detectDeviceType();
  const preset = DEVICE_PRESETS[device];

  // Extract the public ID from the URL
  // Example: https://res.cloudinary.com/m3hransh/video/upload/q_auto:good,f_auto,w_600,br_500k,vc_auto/mafia-roles/Chef.webm
  const parts = videoUrl.split('/upload/');
  if (parts.length !== 2) return videoUrl;

  const [base, pathPart] = parts;

  // Remove existing transformations to get the public ID
  const publicIdMatch = pathPart.match(/(?:mafia-roles\/.+\.webm)/);
  if (!publicIdMatch) return videoUrl;

  const publicId = publicIdMatch[0];

  // Build optimized transformations
  const width = options.width || preset.width;
  const bitrate = options.bitrate || preset.bitrate;
  const quality = options.quality
    ? `q_auto:${options.quality}`
    : preset.quality;

  const transformations = [
    quality,
    'f_auto', // Auto format
    `w_${width}`, // Width
    `br_${bitrate}`, // Bitrate
    'vc_auto', // Video codec auto
  ].join(',');

  return `${base}/upload/${transformations}/${publicId}`;
}

/**
 * Generates a poster image URL from a Cloudinary video
 * Extracts the first frame as a thumbnail
 */
export function getVideoPoster(videoUrl: string, width = 400): string {
  if (!videoUrl.includes('cloudinary.com')) {
    return '';
  }

  const parts = videoUrl.split('/upload/');
  if (parts.length !== 2) return '';

  const [base, pathPart] = parts;
  const publicIdMatch = pathPart.match(/(mafia-roles\/.+)\.webm/);
  if (!publicIdMatch) return '';

  const publicIdWithoutExt = publicIdMatch[1];

  // Convert video to image by extracting first frame
  const transformations = [
    'f_jpg', // Convert to JPG
    'q_auto:good',
    `w_${width}`,
    'so_0', // Start offset at 0 seconds
  ].join(',');

  return `${base.replace('/video/', '/image/')}/upload/${transformations}/${publicIdWithoutExt}.jpg`;
}

/**
 * Hook to get responsive video URL that updates on resize
 */
export function useResponsiveVideo(videoUrl: string, options: CloudinaryOptions = {}) {
  if (typeof window === 'undefined') {
    return optimizeCloudinaryVideo(videoUrl, { ...options, device: 'desktop' });
  }

  const [optimizedUrl, setOptimizedUrl] = React.useState(() =>
    optimizeCloudinaryVideo(videoUrl, options)
  );

  React.useEffect(() => {
    const handleResize = () => {
      setOptimizedUrl(optimizeCloudinaryVideo(videoUrl, options));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [videoUrl, options]);

  return optimizedUrl;
}
