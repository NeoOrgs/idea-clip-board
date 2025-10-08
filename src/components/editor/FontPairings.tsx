import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface FontPairing {
  id: string;
  name: string;
  heading: string;
  body: string;
  description: string;
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: "classic-serif",
    name: "Classic Serif",
    heading: "Playfair Display",
    body: "Lato",
    description: "Elegant and timeless"
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    heading: "Montserrat",
    body: "Open Sans",
    description: "Clean and professional"
  },
  {
    id: "bold-impact",
    name: "Bold Impact",
    heading: "Bebas Neue",
    body: "Roboto",
    description: "Strong and attention-grabbing"
  },
  {
    id: "friendly-casual",
    name: "Friendly Casual",
    heading: "Poppins",
    body: "Lato",
    description: "Approachable and warm"
  },
  {
    id: "tech-corporate",
    name: "Tech Corporate",
    heading: "Raleway",
    body: "Open Sans",
    description: "Professional and modern"
  },
  {
    id: "creative-playful",
    name: "Creative Playful",
    heading: "Lobster",
    body: "Montserrat",
    description: "Fun and expressive"
  },
  {
    id: "elegant-script",
    name: "Elegant Script",
    heading: "Dancing Script",
    body: "Lato",
    description: "Graceful and sophisticated"
  },
  {
    id: "editorial",
    name: "Editorial",
    heading: "Merriweather",
    body: "Open Sans",
    description: "Traditional and readable"
  },
];

export const TEXT_PRESETS = [
  { id: "heading", name: "Heading", size: 64, weight: "bold" },
  { id: "subheading", name: "Subheading", size: 36, weight: "semibold" },
  { id: "body", name: "Body Text", size: 20, weight: "normal" },
  { id: "caption", name: "Caption", size: 14, weight: "normal" },
];

interface FontPairingsProps {
  onSelectPairing: (pairing: FontPairing) => void;
  onAddTextPreset: (preset: typeof TEXT_PRESETS[0]) => void;
  selectedPairing?: FontPairing;
}

export const FontPairings = ({ onSelectPairing, onAddTextPreset, selectedPairing }: FontPairingsProps) => {
  return (
    <div className="h-full">
      <h3 className="font-semibold mb-3">Text</h3>
      
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Quick Add</label>
        <div className="grid grid-cols-2 gap-2">
          {TEXT_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => onAddTextPreset(preset)}
              className="justify-start"
            >
              <span className="text-xs">{preset.name}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="text-sm font-medium">Font Pairings</label>
      </div>
      
      <ScrollArea className="h-[350px]">
        <div className="space-y-2 pr-4">
          {FONT_PAIRINGS.map((pairing) => (
            <Card
              key={pairing.id}
              className={`p-3 cursor-pointer transition-colors ${
                selectedPairing?.id === pairing.id 
                  ? "bg-accent border-primary" 
                  : "hover:bg-accent"
              }`}
              onClick={() => onSelectPairing(pairing)}
            >
              <div className="space-y-1">
                <p className="font-semibold text-sm">{pairing.name}</p>
                <p
                  className="text-lg"
                  style={{ fontFamily: pairing.heading }}
                >
                  {pairing.heading}
                </p>
                <p
                  className="text-sm text-muted-foreground"
                  style={{ fontFamily: pairing.body }}
                >
                  {pairing.body}
                </p>
                <p className="text-xs text-muted-foreground">{pairing.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
