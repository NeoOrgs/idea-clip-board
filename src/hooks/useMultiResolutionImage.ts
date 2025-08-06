import { useState, useEffect } from 'react';
import { useNetworkSpeed } from './useNetworkSpeed';
import { getImageUrlWithResolution, getResolutionForNetworkSpeed, preloadImage, type ImageResolution } from '@/utils/imageUtils';

interface UseMultiResolutionImageProps {
  originalUrl: string;
  preloadOnHover?: boolean;
}

export const useMultiResolutionImage = ({ originalUrl, preloadOnHover = false }: UseMultiResolutionImageProps) => {
  const { networkSpeed, isLoading: networkLoading } = useNetworkSpeed();
  const [currentResolution, setCurrentResolution] = useState<ImageResolution>('240p');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [preloadedHighRes, setPreloadedHighRes] = useState(false);

  // Get the appropriate resolution based on network speed
  useEffect(() => {
    if (!networkLoading && networkSpeed) {
      const networkBasedResolution = getResolutionForNetworkSpeed(networkSpeed);
      setCurrentResolution(networkBasedResolution);
    }
  }, [networkSpeed, networkLoading]);

  // Get the current image URL based on resolution
  const currentImageUrl = getImageUrlWithResolution(originalUrl, currentResolution);
  const originalImageUrl = getImageUrlWithResolution(originalUrl, 'original');

  const handleImageLoad = () => {
    setIsImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsImageLoading(false);
    setImageError(true);
  };

  // Preload higher resolution for fast connections when hovering
  const handleHover = async () => {
    if (preloadOnHover && networkSpeed === 'fast' && !preloadedHighRes && currentResolution !== 'original') {
      try {
        await preloadImage(originalImageUrl);
        setPreloadedHighRes(true);
      } catch (error) {
        console.warn('Failed to preload high resolution image:', error);
      }
    }
  };

  // Load maximum resolution (for when user selects/maximizes the pin)
  const loadMaxResolution = () => {
    if (currentResolution !== 'original') {
      setCurrentResolution('original');
      setIsImageLoading(true);
    }
  };

  // Reset to network-based resolution
  const resetToNetworkResolution = () => {
    if (networkSpeed && currentResolution === 'original') {
      const networkBasedResolution = getResolutionForNetworkSpeed(networkSpeed);
      setCurrentResolution(networkBasedResolution);
      setIsImageLoading(true);
    }
  };

  return {
    currentImageUrl,
    originalImageUrl,
    currentResolution,
    isImageLoading,
    imageError,
    networkSpeed,
    networkLoading,
    handleImageLoad,
    handleImageError,
    handleHover,
    loadMaxResolution,
    resetToNetworkResolution,
    isMaxResolution: currentResolution === 'original'
  };
};