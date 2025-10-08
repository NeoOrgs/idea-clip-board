import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Trash2, Copy, Lock, Unlock } from "lucide-react";
import { useState } from "react";

export interface Layer {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  fabricObject: any;
}

interface LayerPanelProps {
  layers: Layer[];
  selectedLayerId?: string;
  onSelectLayer: (layer: Layer) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onReorderLayers: (draggedId: string, targetId: string) => void;
}

export const LayerPanel = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onDeleteLayer,
  onDuplicateLayer,
}: LayerPanelProps) => {
  const [draggedLayer, setDraggedLayer] = useState<string | null>(null);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Layers</h3>
        <span className="text-xs text-muted-foreground">{layers.length} items</span>
      </div>

      <ScrollArea className="h-[450px]">
        <div className="space-y-1 pr-4">
          {layers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No layers yet. Add elements to see them here.
            </div>
          ) : (
            layers.map((layer) => (
              <div
                key={layer.id}
                className={`group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  selectedLayerId === layer.id
                    ? "bg-accent border border-primary"
                    : "hover:bg-accent border border-transparent"
                }`}
                onClick={() => onSelectLayer(layer)}
                draggable={!layer.locked}
                onDragStart={() => setDraggedLayer(layer.id)}
                onDragEnd={() => setDraggedLayer(null)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{layer.name}</p>
                  <p className="text-xs text-muted-foreground">{layer.type}</p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(layer.id);
                    }}
                  >
                    {layer.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(layer.id);
                    }}
                  >
                    {layer.locked ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateLayer(layer.id);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
