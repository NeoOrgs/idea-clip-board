import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage, Textbox, Rect, Circle, Triangle, Line, FabricObject } from "fabric";
import * as fabric from "fabric";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Layers } from "lucide-react";
import Header from "@/components/Header";
import { TemplateLibrary, Template } from "@/components/editor/TemplateLibrary";
import { ElementLibrary, ELEMENT_ICONS } from "@/components/editor/ElementLibrary";
import { FontPairings, FontPairing, TEXT_PRESETS } from "@/components/editor/FontPairings";
import { LayerPanel, Layer } from "@/components/editor/LayerPanel";
import { ImageFilters, IMAGE_FILTERS, ImageFilter } from "@/components/editor/ImageFilters";
import { CanvasControls } from "@/components/editor/CanvasControls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ImageEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null);
  const [fillColor, setFillColor] = useState("#4F46E5");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [selectedPairing, setSelectedPairing] = useState<FontPairing | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1080,
      height: 1080,
      backgroundColor: backgroundColor,
    });

    setFabricCanvas(canvas);
    saveToHistory(canvas);

    canvas.on("selection:created", (e) => {
      const obj = e.selected?.[0];
      setSelectedObject(obj);
      updateSelectedLayer(obj);
    });

    canvas.on("selection:updated", (e) => {
      const obj = e.selected?.[0];
      setSelectedObject(obj);
      updateSelectedLayer(obj);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
      setSelectedLayer(null);
    });

    canvas.on("object:added", () => {
      updateLayers(canvas);
      saveToHistory(canvas);
    });

    canvas.on("object:removed", () => {
      updateLayers(canvas);
      saveToHistory(canvas);
    });

    canvas.on("object:modified", () => {
      saveToHistory(canvas);
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  const updateSelectedLayer = (obj: any) => {
    if (!obj) return;
    const layer = layers.find(l => l.fabricObject === obj);
    if (layer) setSelectedLayer(layer);
  };

  const updateLayers = (canvas: FabricCanvas) => {
    const objects = canvas.getObjects();
    const newLayers: Layer[] = objects.map((obj, index) => {
      const existingLayer = layers.find(l => l.fabricObject === obj);
      return {
        id: existingLayer?.id || `layer-${Date.now()}-${index}`,
        name: existingLayer?.name || getObjectName(obj, index),
        type: getObjectType(obj),
        visible: obj.visible !== false,
        locked: obj.selectable === false,
        fabricObject: obj,
      };
    }).reverse();
    setLayers(newLayers);
  };

  const getObjectName = (obj: any, index: number): string => {
    if (obj.type === 'textbox') return `Text ${index + 1}`;
    if (obj.type === 'image') return `Image ${index + 1}`;
    if (obj.type === 'rect') return `Rectangle ${index + 1}`;
    if (obj.type === 'circle') return `Circle ${index + 1}`;
    if (obj.type === 'triangle') return `Triangle ${index + 1}`;
    if (obj.type === 'line') return `Line ${index + 1}`;
    return `Element ${index + 1}`;
  };

  const getObjectType = (obj: any): string => {
    const typeMap: Record<string, string> = {
      textbox: 'Text',
      image: 'Image',
      rect: 'Rectangle',
      circle: 'Circle',
      triangle: 'Triangle',
      line: 'Line',
    };
    return typeMap[obj.type] || 'Shape';
  };

  const saveToHistory = (canvas: FabricCanvas) => {
    const json = canvas.toJSON();
    setHistory(prev => [...prev.slice(0, historyIndex + 1), json]);
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex <= 0 || !fabricCanvas) return;
    const newIndex = historyIndex - 1;
    fabricCanvas.loadFromJSON(history[newIndex], () => {
      fabricCanvas.renderAll();
      updateLayers(fabricCanvas);
      setHistoryIndex(newIndex);
    });
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1 || !fabricCanvas) return;
    const newIndex = historyIndex + 1;
    fabricCanvas.loadFromJSON(history[newIndex], () => {
      fabricCanvas.renderAll();
      updateLayers(fabricCanvas);
      setHistoryIndex(newIndex);
    });
  };

  const handleSelectTemplate = (template: Template) => {
    if (!fabricCanvas) return;
    fabricCanvas.setDimensions({ width: template.width, height: template.height });
    fabricCanvas.backgroundColor = template.bg;
    setBackgroundColor(template.bg);
    fabricCanvas.renderAll();
    toast({ title: "Template applied!", description: template.name });
  };

  const handleAddShape = (shape: string, color: string) => {
    if (!fabricCanvas) return;

    let obj: FabricObject;
    const options = { left: 100, top: 100, fill: color };

    switch (shape) {
      case "rect":
        obj = new Rect({ ...options, width: 200, height: 150 });
        break;
      case "circle":
        obj = new Circle({ ...options, radius: 75 });
        break;
      case "triangle":
        obj = new Triangle({ ...options, width: 150, height: 150 });
        break;
      case "line":
        obj = new Line([50, 50, 200, 50], { stroke: color, strokeWidth: 3 });
        break;
      default:
        return;
    }

    fabricCanvas.add(obj);
    fabricCanvas.setActiveObject(obj);
    fabricCanvas.renderAll();
  };

  const handleAddIcon = async (iconName: string, color: string) => {
    if (!fabricCanvas) return;

    const icon = ELEMENT_ICONS.find(i => i.name === iconName);
    if (!icon) return;

    // Create SVG string from the icon
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${await getIconPath(iconName)}
      </svg>
    `;

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const img = await FabricImage.fromURL(url);
    img.set({ left: 100, top: 100 });
    fabricCanvas.add(img);
    fabricCanvas.setActiveObject(img);
    fabricCanvas.renderAll();
    URL.revokeObjectURL(url);
  };

  const getIconPath = async (iconName: string): Promise<string> => {
    // Simplified icon paths - in production, you'd want actual SVG paths
    const paths: Record<string, string> = {
      Heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>',
      Star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
      // Add more icon paths as needed
    };
    return paths[iconName] || '<circle cx="12" cy="12" r="10"></circle>';
  };

  const handleSelectPairing = (pairing: FontPairing) => {
    setSelectedPairing(pairing);
    toast({ 
      title: "Font pairing selected", 
      description: `${pairing.heading} + ${pairing.body}` 
    });
  };

  const handleAddTextPreset = (preset: typeof TEXT_PRESETS[0]) => {
    if (!fabricCanvas) return;

    const fontFamily = preset.id === 'heading' || preset.id === 'subheading'
      ? selectedPairing?.heading || 'Montserrat'
      : selectedPairing?.body || 'Open Sans';

    const text = new Textbox(`${preset.name}`, {
      left: 100,
      top: 100,
      fontSize: preset.size,
      fontFamily: fontFamily,
      fontWeight: preset.weight,
      fill: '#000000',
      width: 400,
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = await FabricImage.fromURL(event.target?.result as string);
        const scale = Math.min(
          (fabricCanvas.width! * 0.6) / img.width!,
          (fabricCanvas.height! * 0.6) / img.height!
        );
        img.scale(scale);
        img.set({
          left: (fabricCanvas.width! - img.width! * scale) / 2,
          top: (fabricCanvas.height! - img.height! * scale) / 2,
        });
        fabricCanvas.add(img);
        fabricCanvas.renderAll();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image.", variant: "destructive" });
    }
  };

  const handleApplyFilter = (filter: ImageFilter) => {
    if (!selectedObject || selectedObject.type !== 'image' || !selectedObject.filters) return;

    selectedObject.filters = [];

    if (filter.filters.grayscale) {
      const Grayscale = (fabric as any).Image?.filters?.Grayscale;
      if (Grayscale) selectedObject.filters.push(new Grayscale());
    }
    if (filter.filters.sepia) {
      const Sepia = (fabric as any).Image?.filters?.Sepia;
      if (Sepia) selectedObject.filters.push(new Sepia());
    }
    if (filter.filters.brightness) {
      const Brightness = (fabric as any).Image?.filters?.Brightness;
      if (Brightness) selectedObject.filters.push(new Brightness({ brightness: filter.filters.brightness }));
    }
    if (filter.filters.contrast) {
      const Contrast = (fabric as any).Image?.filters?.Contrast;
      if (Contrast) selectedObject.filters.push(new Contrast({ contrast: filter.filters.contrast }));
    }

    if (selectedObject.applyFilters) {
      selectedObject.applyFilters();
    }
    fabricCanvas?.renderAll();
    toast({ title: "Filter applied", description: filter.name });
  };

  const handleBrightnessChange = (value: number) => {
    setBrightness(value);
    if (!selectedObject || selectedObject.type !== 'image' || !selectedObject.filters) return;
    
    const Brightness = (fabric as any).Image?.filters?.Brightness;
    if (!Brightness) return;

    const brightnessFilter = new Brightness({ brightness: value / 100 });
    
    selectedObject.filters = selectedObject.filters.filter((f: any) => f.type !== 'Brightness');
    selectedObject.filters.push(brightnessFilter);
    
    if (selectedObject.applyFilters) {
      selectedObject.applyFilters();
    }
    fabricCanvas?.renderAll();
  };

  const handleContrastChange = (value: number) => {
    setContrast(value);
    if (!selectedObject || selectedObject.type !== 'image' || !selectedObject.filters) return;
    
    const Contrast = (fabric as any).Image?.filters?.Contrast;
    if (!Contrast) return;

    const contrastFilter = new Contrast({ contrast: value / 100 });
    
    selectedObject.filters = selectedObject.filters.filter((f: any) => f.type !== 'Contrast');
    selectedObject.filters.push(contrastFilter);
    
    if (selectedObject.applyFilters) {
      selectedObject.applyFilters();
    }
    fabricCanvas?.renderAll();
  };

  const handleLayerAction = {
    select: (layer: Layer) => {
      if (!fabricCanvas) return;
      fabricCanvas.setActiveObject(layer.fabricObject);
      fabricCanvas.renderAll();
      setSelectedLayer(layer);
    },
    toggleVisibility: (layerId: string) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer || !fabricCanvas) return;
      layer.fabricObject.visible = !layer.fabricObject.visible;
      fabricCanvas.renderAll();
      updateLayers(fabricCanvas);
    },
    toggleLock: (layerId: string) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer || !fabricCanvas) return;
      layer.fabricObject.selectable = !layer.fabricObject.selectable;
      layer.fabricObject.evented = !layer.fabricObject.evented;
      fabricCanvas.renderAll();
      updateLayers(fabricCanvas);
    },
    delete: (layerId: string) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer || !fabricCanvas) return;
      fabricCanvas.remove(layer.fabricObject);
      fabricCanvas.renderAll();
    },
    duplicate: (layerId: string) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer || !fabricCanvas) return;
      layer.fabricObject.clone((cloned: any) => {
        cloned.set({ left: cloned.left + 20, top: cloned.top + 20 });
        fabricCanvas.add(cloned);
        fabricCanvas.renderAll();
      });
    },
    reorder: (draggedId: string, targetId: string) => {
      // Implement layer reordering
    },
  };

  const handleZoom = {
    in: () => {
      if (!fabricCanvas) return;
      const newZoom = Math.min(zoom * 1.2, 5);
      setZoom(newZoom);
      fabricCanvas.setZoom(newZoom);
      fabricCanvas.renderAll();
    },
    out: () => {
      if (!fabricCanvas) return;
      const newZoom = Math.max(zoom / 1.2, 0.1);
      setZoom(newZoom);
      fabricCanvas.setZoom(newZoom);
      fabricCanvas.renderAll();
    },
    fit: () => {
      if (!fabricCanvas || !containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const scaleX = (containerWidth - 40) / fabricCanvas.width!;
      const scaleY = (containerHeight - 40) / fabricCanvas.height!;
      const newZoom = Math.min(scaleX, scaleY, 1);
      setZoom(newZoom);
      fabricCanvas.setZoom(newZoom);
      fabricCanvas.renderAll();
    },
  };

  const handleBackgroundColorChange = (color: string) => {
    if (!fabricCanvas) return;
    setBackgroundColor(color);
    fabricCanvas.backgroundColor = color;
    fabricCanvas.renderAll();
  };

  const downloadImage = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
    const link = document.createElement("a");
    link.download = `design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast({ title: "Downloaded!", description: "Your design has been downloaded." });
  };

  const saveToBoard = async () => {
    if (!fabricCanvas) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const dataURL = fabricCanvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
      const blob = await (await fetch(dataURL)).blob();
      const fileName = `design-${Date.now()}.png`;
      const filePath = `pins/${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pin-images')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pin-images')
        .getPublicUrl(filePath);

      toast({ title: "Saved!", description: "Design uploaded. Now add it to a board." });
      navigate(`/create-pin?imageUrl=${encodeURIComponent(publicUrl)}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CanvasControls
        zoom={zoom}
        onZoomIn={handleZoom.in}
        onZoomOut={handleZoom.out}
        onFitToScreen={handleZoom.fit}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDownload={downloadImage}
        onSave={saveToBoard}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        backgroundColor={backgroundColor}
        onBackgroundColorChange={handleBackgroundColorChange}
        loading={loading}
      />

      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Sidebar - Tools */}
        <div className="w-80 border-r bg-card p-4 overflow-y-auto">
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
              <TabsTrigger value="text" className="text-xs">Text</TabsTrigger>
              <TabsTrigger value="elements" className="text-xs">Elements</TabsTrigger>
              <TabsTrigger value="images" className="text-xs">Images</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-4">
              <TemplateLibrary onSelectTemplate={handleSelectTemplate} />
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <FontPairings
                onSelectPairing={handleSelectPairing}
                onAddTextPreset={handleAddTextPreset}
                selectedPairing={selectedPairing}
              />
            </TabsContent>

            <TabsContent value="elements" className="mt-4">
              <ElementLibrary
                onAddShape={handleAddShape}
                onAddIcon={handleAddIcon}
                fillColor={fillColor}
                onColorChange={setFillColor}
              />
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              <ImageFilters
                onUploadImage={handleUploadImage}
                onApplyFilter={handleApplyFilter}
                brightness={brightness}
                contrast={contrast}
                onBrightnessChange={handleBrightnessChange}
                onContrastChange={handleContrastChange}
                hasSelectedImage={selectedObject?.type === 'image'}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 bg-muted/20 overflow-hidden" ref={containerRef}>
          <div className="w-full h-full flex items-center justify-center p-8">
            <div className="shadow-2xl">
              <canvas ref={canvasRef} />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Layers */}
        <div className="w-80 border-l bg-card p-4 overflow-y-auto">
          <LayerPanel
            layers={layers}
            selectedLayerId={selectedLayer?.id}
            onSelectLayer={handleLayerAction.select}
            onToggleVisibility={handleLayerAction.toggleVisibility}
            onToggleLock={handleLayerAction.toggleLock}
            onDeleteLayer={handleLayerAction.delete}
            onDuplicateLayer={handleLayerAction.duplicate}
            onReorderLayers={handleLayerAction.reorder}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
