import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PinCard from "./PinCard";
import { cn } from "@/lib/utils";

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

interface PinGridProps {
  pins: Pin[];
  onPinClick?: (pin: Pin) => void;
  className?: string;
  currentUserId?: string;
  onPinDeleted?: (pinId: string) => void;
}

const PinGrid = ({ pins, onPinClick, className, currentUserId, onPinDeleted }: PinGridProps) => {
  const [columns, setColumns] = useState(4);
  const navigate = useNavigate();

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(2);      // mobile
      else if (width < 768) setColumns(3); // tablet
      else if (width < 1024) setColumns(4); // desktop
      else if (width < 1280) setColumns(5); // large desktop
      else setColumns(6);                   // xl desktop
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Distribute pins into columns for masonry layout
  const distributeIntoColumns = () => {
    const columnArrays: Pin[][] = Array.from({ length: columns }, () => []);
    
    pins.forEach((pin, index) => {
      const columnIndex = index % columns;
      columnArrays[columnIndex].push(pin);
    });
    
    return columnArrays;
  };

  const columnArrays = distributeIntoColumns();

  if (pins.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
            <span className="text-3xl">📌</span>
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gradient">No pins yet</h3>
          <p className="text-muted-foreground text-lg font-medium">Start creating pins to see them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div 
        className="grid gap-6 lg:gap-8"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {columnArrays.map((columnPins, columnIndex) => (
          <div key={columnIndex} className="space-y-6 lg:space-y-8">
            {columnPins.map((pin) => (
              <PinCard
                key={pin.id}
                pin={pin}
                onClick={() => {
                  navigate(`/pin/${pin.id}`);
                  onPinClick?.(pin);
                }}
                className="w-full pin-card-premium"
                currentUserId={currentUserId}
                onPinDeleted={onPinDeleted}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PinGrid;