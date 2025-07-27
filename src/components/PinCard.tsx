import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import SavePinDialog from "./SavePinDialog";
import ImageActions from "./ImageActions";

interface Pin {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  original_url?: string;
  user_id: string;
  board_id: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email: string;
  };
}

interface PinCardProps {
  pin: Pin;
  onClick?: () => void;
  className?: string;
}

const PinCard = ({ pin, onClick, className }: PinCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden rounded-lg cursor-pointer transition-all duration-200 hover:shadow-card",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Image */}
        <div className="relative overflow-hidden rounded-lg">
          {!imageError ? (
            <img
              src={pin.image_url}
              alt={pin.title}
              className={cn(
                "w-full h-auto object-cover transition-all duration-300",
                isImageLoaded ? "opacity-100" : "opacity-0",
                isHovered && "scale-105"
              )}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setIsImageLoaded(true);
              }}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-48 bg-muted flex items-center justify-center rounded-lg">
              <span className="text-muted-foreground text-sm">Failed to load image</span>
            </div>
          )}
          
          {/* Loading skeleton */}
          {!isImageLoaded && !imageError && (
            <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
          )}
        </div>

        {/* Hover overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/20 transition-opacity duration-200">
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button
                size="sm"
                className="rounded-full shadow-lg bg-primary hover:bg-primary-hover"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSaveDialog(true);
                }}
              >
                Save
              </Button>
              <ImageActions 
                imageUrl={pin.image_url} 
                title={pin.title}
                className="bg-white/90 backdrop-blur-sm rounded-full p-1"
              />
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full bg-white/90 hover:bg-white text-foreground shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle more options
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            
            {pin.original_url && (
              <div className="absolute bottom-2 left-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full bg-white/90 hover:bg-white text-foreground shadow-lg text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(pin.original_url, '_blank');
                  }}
                >
                  Visit
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <SavePinDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        pinId={pin.id}
        pinTitle={pin.title}
      />

      {/* Pin info */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">
          {pin.title}
        </h3>
        {pin.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {pin.description}
          </p>
        )}
        {pin.profiles && (
          <div className="flex items-center text-xs text-muted-foreground">
            <span>{pin.profiles.full_name || pin.profiles.email}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PinCard;