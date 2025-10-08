import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage, Textbox, Rect, Circle, Triangle } from "fabric";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Type, Square, Circle as CircleIcon, Triangle as TriangleIcon, Image as ImageIcon, Download, Save, Trash2, Upload } from "lucide-react";
import Header from "@/components/Header";

const FONTS = [
  "Arial", "Helvetica", "Times New Roman", "Georgia", "Verdana",
  "Playfair Display", "Montserrat", "Roboto", "Lato", "Open Sans",
  "Poppins", "Raleway", "Bebas Neue", "Dancing Script", "Pacifico",
  "Lobster", "Caveat", "Oswald", "Merriweather"
];

const TEMPLATES = [
  { id: "social-post", name: "Social Post", width: 1080, height: 1080, bg: "#f0f0f0" },
  { id: "story", name: "Story", width: 1080, height: 1920, bg: "#ffffff" },
  { id: "banner", name: "Banner", width: 1920, height: 1080, bg: "#e0e0e0" },
  { id: "flyer", name: "Flyer", width: 816, height: 1056, bg: "#fafafa" },
  { id: "card", name: "Card", width: 800, height: 600, bg: "#f5f5f5" },
];

const ImageEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [textContent, setTextContent] = useState("");
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("#3498db");
  const [loading, setLoading] = useState(false);
  const [pins, setPins] = useState<any[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pinId = searchParams.get("pinId");

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1080,
      height: 1080,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);

    canvas.on("selection:created", (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on("selection:updated", (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    fetchUserPins();
    if (pinId) {
      loadPinImage(pinId);
    }
  }, [pinId]);

  const fetchUserPins = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setPins(data);
    }
  };

  const loadPinImage = async (id: string) => {
    const pin = pins.find(p => p.id === id);
    if (!pin || !fabricCanvas) return;

    try {
      const img = await FabricImage.fromURL(pin.image_url, {
        crossOrigin: 'anonymous'
      });
      
      const scale = Math.min(
        fabricCanvas.width! / img.width!,
        fabricCanvas.height! / img.height!
      );
      
      img.scale(scale);
      img.set({
        left: (fabricCanvas.width! - img.width! * scale) / 2,
        top: (fabricCanvas.height! - img.height! * scale) / 2,
      });
      
      fabricCanvas.add(img);
      fabricCanvas.renderAll();
      
      toast({
        title: "Image loaded!",
        description: "Your pin image has been added to the canvas.",
      });
    } catch (error) {
      console.error("Error loading image:", error);
      toast({
        title: "Error",
        description: "Failed to load image.",
        variant: "destructive",
      });
    }
  };

  const addText = () => {
    if (!fabricCanvas || !textContent) return;

    const text = new Textbox(textContent, {
      left: 100,
      top: 100,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
      width: 400,
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    setTextContent("");
  };

  const addShape = (type: "rect" | "circle" | "triangle") => {
    if (!fabricCanvas) return;

    let shape;
    const options = {
      left: 100,
      top: 100,
      fill: fillColor,
    };

    switch (type) {
      case "rect":
        shape = new Rect({ ...options, width: 200, height: 150 });
        break;
      case "circle":
        shape = new Circle({ ...options, radius: 75 });
        break;
      case "triangle":
        shape = new Triangle({ ...options, width: 150, height: 150 });
        break;
    }

    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
    fabricCanvas.renderAll();
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = await FabricImage.fromURL(event.target?.result as string);
        
        const scale = Math.min(
          (fabricCanvas.width! * 0.8) / img.width!,
          (fabricCanvas.height! * 0.8) / img.height!
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
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image.",
        variant: "destructive",
      });
    }
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    if (!fabricCanvas) return;

    fabricCanvas.setDimensions({ width: template.width, height: template.height });
    fabricCanvas.backgroundColor = template.bg;
    fabricCanvas.renderAll();

    toast({
      title: "Template applied!",
      description: `Canvas set to ${template.name} dimensions.`,
    });
  };

  const deleteSelected = () => {
    if (!fabricCanvas || !selectedObject) return;
    fabricCanvas.remove(selectedObject);
    fabricCanvas.renderAll();
  };

  const downloadImage = () => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 1,
    });

    const link = document.createElement("a");
    link.download = `edited-image-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    toast({
      title: "Downloaded!",
      description: "Your image has been downloaded.",
    });
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

      const dataURL = fabricCanvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 1,
      });

      const blob = await (await fetch(dataURL)).blob();
      const fileName = `edited-${Date.now()}.png`;
      const filePath = `pins/${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pin-images')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pin-images')
        .getPublicUrl(filePath);

      toast({
        title: "Saved!",
        description: "Image uploaded. Now add it to a board.",
      });

      navigate(`/create-pin?imageUrl=${encodeURIComponent(publicUrl)}`);
    } catch (error: any) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save image.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soft-gray">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
          <h1 className="text-3xl font-bold">Image Editor</h1>
          <p className="text-muted-foreground mt-2">Create stunning graphics with custom fonts and templates</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Tools */}
          <Card className="lg:col-span-1 p-4 h-fit">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="text">
                  <Type className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="shapes">
                  <Square className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="images">
                  <ImageIcon className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <span className="text-xs">T</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div>
                  <Label>Text Content</Label>
                  <Input
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Enter text"
                  />
                </div>
                <div>
                  <Label>Font Family</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {FONTS.map(font => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Font Size: {fontSize}px</Label>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([val]) => setFontSize(val)}
                    min={12}
                    max={120}
                    step={1}
                  />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                  />
                </div>
                <Button onClick={addText} className="w-full">
                  Add Text
                </Button>
              </TabsContent>

              <TabsContent value="shapes" className="space-y-4">
                <div>
                  <Label>Fill Color</Label>
                  <Input
                    type="color"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={() => addShape("rect")} variant="outline">
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => addShape("circle")} variant="outline">
                    <CircleIcon className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => addShape("triangle")} variant="outline">
                    <TriangleIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <div>
                  <Label>Upload Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={uploadImage}
                  />
                </div>
                <div>
                  <Label>Your Pins</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto mt-2">
                    {pins.map(pin => (
                      <img
                        key={pin.id}
                        src={pin.image_url}
                        alt={pin.title}
                        className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                        onClick={() => loadPinImage(pin.id)}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-4">
                <div className="space-y-2">
                  {TEMPLATES.map(template => (
                    <Button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <span className="text-sm">{template.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {template.width}x{template.height}
                      </span>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Center - Canvas */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <div className="overflow-auto max-h-[70vh] flex items-center justify-center bg-gray-100 rounded">
                <canvas ref={canvasRef} />
              </div>
            </Card>
          </div>

          {/* Right Panel - Actions */}
          <Card className="lg:col-span-1 p-4 h-fit space-y-4">
            <h3 className="font-semibold">Actions</h3>
            
            {selectedObject && (
              <Button
                onClick={deleteSelected}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            )}

            <Button
              onClick={downloadImage}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>

            <Button
              onClick={saveToBoard}
              disabled={loading}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save to Board"}
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ImageEditor;
