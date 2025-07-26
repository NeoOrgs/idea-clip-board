import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';

export const LogoProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const processAndUploadLogos = async () => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const logoUrls = [
        '/lovable-uploads/75c3262a-669c-4a33-a7ab-a6c343909014.png', // Dark theme logo
        '/lovable-uploads/fc2458dd-35c0-40fd-9ac9-214426b6cb47.png'  // Light theme logo
      ];

      const logoNames = ['logo-dark', 'logo-light'];

      for (let i = 0; i < logoUrls.length; i++) {
        const logoUrl = logoUrls[i];
        const logoName = logoNames[i];
        
        setProgress((i / logoUrls.length) * 50);
        
        // Fetch the image
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        
        // Load image element
        const imageElement = await loadImage(blob);
        
        // Remove background
        toast({
          title: "Processing...",
          description: `Removing background from ${logoName}...`,
        });
        
        const processedBlob = await removeBackground(imageElement);
        
        setProgress((i / logoUrls.length) * 75);
        
        // Upload to Supabase storage
        const fileName = `${logoName}-no-bg.png`;
        const { data, error } = await supabase.storage
          .from('pin-images')
          .upload(`logos/${fileName}`, processedBlob, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/png'
          });

        if (error) {
          throw new Error(`Failed to upload ${logoName}: ${error.message}`);
        }

        toast({
          title: "Success",
          description: `${logoName} processed and uploaded successfully!`,
        });
        
        setProgress(((i + 1) / logoUrls.length) * 100);
      }

      toast({
        title: "All logos processed!",
        description: "Both logos have been processed and uploaded to Supabase storage with backgrounds removed.",
      });

    } catch (error) {
      console.error('Error processing logos:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process logos",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Process Logo Images</h3>
      <p className="text-sm text-muted-foreground mb-4">
        This will remove backgrounds from both logo images and upload them to Supabase storage.
      </p>
      
      {isProcessing && (
        <div className="mb-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">{progress.toFixed(0)}% complete</p>
        </div>
      )}
      
      <Button 
        onClick={processAndUploadLogos}
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing..." : "Process & Upload Logos"}
      </Button>
    </Card>
  );
};