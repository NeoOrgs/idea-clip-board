export const downloadImage = async (imageUrl: string, filename?: string) => {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    
    const blob = await response.blob();
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename
    const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const defaultFilename = `image_${Date.now()}.${extension}`;
    link.download = filename || defaultFilename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    return false;
  }
};