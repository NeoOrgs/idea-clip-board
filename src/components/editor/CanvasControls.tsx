import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZoomIn, ZoomOut, Maximize, Undo2, Redo2, Download, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CanvasControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  loading?: boolean;
}

export const CanvasControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onUndo,
  onRedo,
  onDownload,
  onSave,
  canUndo,
  canRedo,
  backgroundColor,
  onBackgroundColorChange,
  loading,
}: CanvasControlsProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-background border-b">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomOut}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomIn}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFitToScreen}
            title="Fit to Screen"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-2">
          <Label className="text-sm">Background:</Label>
          <Input
            type="color"
            value={backgroundColor}
            onChange={(e) => onBackgroundColorChange(e.target.value)}
            className="w-12 h-8 cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={loading}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save to Board"}
        </Button>
      </div>
    </div>
  );
};
