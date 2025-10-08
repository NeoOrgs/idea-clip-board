import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Square, Circle, Triangle, Star, Heart, Zap, Cloud, Sun, Moon,
  Home, User, Mail, Phone, MapPin, Calendar, Clock, Camera,
  ShoppingCart, Gift, Music, Video, Image, File, Folder,
  Settings, Search, Filter, Download, Upload, Share2, Link2,
  CheckCircle, XCircle, AlertCircle, Info, HelpCircle,
  Play, Pause, SkipForward, SkipBack, Volume2, Mic,
  TrendingUp, DollarSign, Award, Target, Flag, Bookmark,
  MessageSquare, Send, Bell, Tag, Percent, Hash
} from "lucide-react";

export const ELEMENT_ICONS = [
  { name: "Square", Icon: Square },
  { name: "Circle", Icon: Circle },
  { name: "Triangle", Icon: Triangle },
  { name: "Star", Icon: Star },
  { name: "Heart", Icon: Heart },
  { name: "Zap", Icon: Zap },
  { name: "Cloud", Icon: Cloud },
  { name: "Sun", Icon: Sun },
  { name: "Moon", Icon: Moon },
  { name: "Home", Icon: Home },
  { name: "User", Icon: User },
  { name: "Mail", Icon: Mail },
  { name: "Phone", Icon: Phone },
  { name: "MapPin", Icon: MapPin },
  { name: "Calendar", Icon: Calendar },
  { name: "Clock", Icon: Clock },
  { name: "Camera", Icon: Camera },
  { name: "ShoppingCart", Icon: ShoppingCart },
  { name: "Gift", Icon: Gift },
  { name: "Music", Icon: Music },
  { name: "Video", Icon: Video },
  { name: "Image", Icon: Image },
  { name: "File", Icon: File },
  { name: "Folder", Icon: Folder },
  { name: "Settings", Icon: Settings },
  { name: "Search", Icon: Search },
  { name: "Filter", Icon: Filter },
  { name: "Download", Icon: Download },
  { name: "Upload", Icon: Upload },
  { name: "Share", Icon: Share2 },
  { name: "Link", Icon: Link2 },
  { name: "CheckCircle", Icon: CheckCircle },
  { name: "XCircle", Icon: XCircle },
  { name: "AlertCircle", Icon: AlertCircle },
  { name: "Info", Icon: Info },
  { name: "HelpCircle", Icon: HelpCircle },
  { name: "Play", Icon: Play },
  { name: "Pause", Icon: Pause },
  { name: "SkipForward", Icon: SkipForward },
  { name: "SkipBack", Icon: SkipBack },
  { name: "Volume", Icon: Volume2 },
  { name: "Mic", Icon: Mic },
  { name: "TrendingUp", Icon: TrendingUp },
  { name: "DollarSign", Icon: DollarSign },
  { name: "Award", Icon: Award },
  { name: "Target", Icon: Target },
  { name: "Flag", Icon: Flag },
  { name: "Bookmark", Icon: Bookmark },
  { name: "Message", Icon: MessageSquare },
  { name: "Send", Icon: Send },
  { name: "Bell", Icon: Bell },
  { name: "Tag", Icon: Tag },
  { name: "Percent", Icon: Percent },
  { name: "Hash", Icon: Hash },
];

export const BASIC_SHAPES = [
  { id: "rect", name: "Rectangle", Icon: Square },
  { id: "circle", name: "Circle", Icon: Circle },
  { id: "triangle", name: "Triangle", Icon: Triangle },
  { id: "line", name: "Line", Icon: () => <div className="h-0.5 w-6 bg-current" /> },
];

interface ElementLibraryProps {
  onAddShape: (shape: string, color: string) => void;
  onAddIcon: (iconName: string, color: string) => void;
  fillColor: string;
  onColorChange: (color: string) => void;
}

export const ElementLibrary = ({ onAddShape, onAddIcon, fillColor, onColorChange }: ElementLibraryProps) => {
  return (
    <div className="h-full">
      <h3 className="font-semibold mb-3">Elements</h3>
      
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Color</label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={fillColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-16 h-10 cursor-pointer"
          />
          <Input
            type="text"
            value={fillColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="flex-1 font-mono text-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="shapes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shapes">Shapes</TabsTrigger>
          <TabsTrigger value="icons">Icons</TabsTrigger>
        </TabsList>

        <TabsContent value="shapes" className="mt-3">
          <div className="grid grid-cols-3 gap-2">
            {BASIC_SHAPES.map((shape) => (
              <Button
                key={shape.id}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center gap-1"
                onClick={() => onAddShape(shape.id, fillColor)}
              >
                <shape.Icon />
                <span className="text-xs">{shape.name}</span>
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="icons" className="mt-3">
          <ScrollArea className="h-[350px]">
            <div className="grid grid-cols-4 gap-2 pr-4">
              {ELEMENT_ICONS.map((icon) => (
                <Button
                  key={icon.name}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={() => onAddIcon(icon.name, fillColor)}
                  title={icon.name}
                >
                  <icon.Icon className="h-5 w-5" />
                </Button>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
