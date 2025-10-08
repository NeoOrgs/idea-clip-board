import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Upload } from "lucide-react";

export interface ImageFilter {
  id: string;
  name: string;
  filters: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
    grayscale?: boolean;
    sepia?: boolean;
  };
}

export const IMAGE_FILTERS: ImageFilter[] = [
  {
    id: "original",
    name: "Original",
    filters: {}
  },
  {
    id: "bw",
    name: "Black & White",
    filters: { grayscale: true }
  },
  {
    id: "vintage",
    name: "Vintage",
    filters: { sepia: true, contrast: 1.1 }
  },
  {
    id: "bright",
    name: "Bright",
    filters: { brightness: 0.2, saturation: 0.1 }
  },
  {
    id: "dark",
    name: "Dark",
    filters: { brightness: -0.2, contrast: 1.2 }
  },
];

interface ImageFiltersProps {
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApplyFilter: (filter: ImageFilter) => void;
  brightness: number;
  contrast: number;
  onBrightnessChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  hasSelectedImage: boolean;
}

export const ImageFilters = ({
  onUploadImage,
  onApplyFilter,
  brightness,
  contrast,
  onBrightnessChange,
  onContrastChange,
  hasSelectedImage,
}: ImageFiltersProps) => {
  return (
    <div className="h-full space-y-4">
      <div>
        <h3 className="font-semibold mb-3">Images</h3>
        <Label htmlFor="image-upload" className="cursor-pointer">
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">Upload Image</p>
            <p className="text-xs text-muted-foreground mt-1">Click to browse</p>
          </div>
        </Label>
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={onUploadImage}
          className="hidden"
        />
      </div>

      {hasSelectedImage && (
        <>
          <div>
            <h3 className="font-semibold mb-3">Filters</h3>
            <div className="grid grid-cols-2 gap-2">
              {IMAGE_FILTERS.map((filter) => (
                <Card
                  key={filter.id}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors text-center"
                  onClick={() => onApplyFilter(filter)}
                >
                  <p className="text-sm font-medium">{filter.name}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm">Brightness: {brightness}</Label>
              <Slider
                value={[brightness]}
                onValueChange={([val]) => onBrightnessChange(val)}
                min={-100}
                max={100}
                step={1}
              />
            </div>
            <div>
              <Label className="text-sm">Contrast: {contrast}</Label>
              <Slider
                value={[contrast]}
                onValueChange={([val]) => onContrastChange(val)}
                min={-100}
                max={100}
                step={1}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
