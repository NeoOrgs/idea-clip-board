// Utility functions for ping-based image rendering

export type NetworkSpeed = 'fast' | 'medium' | 'slow';
export type ImageResolution = '144p' | '240p' | '360p' | '480p' | '720p' | 'original';

export interface ResolutionConfig {
  width: number;
  height: number;
  quality: number;
}

export const RESOLUTION_CONFIGS: Record<ImageResolution, ResolutionConfig> = {
  '144p': { width: 256, height: 144, quality: 40 },
  '240p': { width: 426, height: 240, quality: 50 },
  '360p': { width: 640, height: 360, quality: 60 },
  '480p': { width: 854, height: 480, quality: 70 },
  '720p': { width: 1280, height: 720, quality: 80 },
  'original': { width: 0, height: 0, quality: 90 } // 0 means no resize
};

export const getResolutionForNetworkSpeed = (networkSpeed: NetworkSpeed): ImageResolution => {
  switch (networkSpeed) {
    case 'slow':
      return '144p';
    case 'medium':
      return '240p';
    case 'fast':
      return '360p';
    default:
      return '240p';
  }
};

export const getImageUrlWithResolution = (
  originalUrl: string, 
  resolution: ImageResolution,
  networkSpeed?: NetworkSpeed
): string => {
  // If network speed is provided, use appropriate resolution
  const finalResolution = networkSpeed ? getResolutionForNetworkSpeed(networkSpeed) : resolution;
  
  // If it's a Supabase storage URL, we can add transformation parameters
  if (originalUrl.includes('.supabase.co/storage/')) {
    const url = new URL(originalUrl);
    const config = RESOLUTION_CONFIGS[finalResolution];
    
    if (finalResolution !== 'original') {
      url.searchParams.set('width', config.width.toString());
      url.searchParams.set('height', config.height.toString());
      url.searchParams.set('quality', config.quality.toString());
      url.searchParams.set('resize', 'contain');
    } else {
      // Remove any existing resize parameters for original quality
      url.searchParams.delete('width');
      url.searchParams.delete('height');
      url.searchParams.delete('quality');
      url.searchParams.delete('resize');
    }
    
    return url.toString();
  }
  
  // For external URLs, return as-is since we can't control their resolution
  return originalUrl;
};

export const getResponsiveImageUrl = (
  originalUrl: string, 
  networkSpeed?: NetworkSpeed
): string => {
  return getImageUrlWithResolution(originalUrl, '240p', networkSpeed);
};

export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};