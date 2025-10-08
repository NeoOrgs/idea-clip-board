import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Template {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  bg: string;
  elements?: any[];
  thumbnail?: string;
}

export const TEMPLATE_CATEGORIES = {
  social: "Social Media",
  marketing: "Marketing",
  presentation: "Presentation",
  print: "Print"
};

export const TEMPLATES: Template[] = [
  // Social Media Templates
  { id: "instagram-post", name: "Instagram Post", category: "social", width: 1080, height: 1080, bg: "#FF6B6B" },
  { id: "instagram-story", name: "Instagram Story", category: "social", width: 1080, height: 1920, bg: "#4ECDC4" },
  { id: "facebook-post", name: "Facebook Post", category: "social", width: 1200, height: 630, bg: "#45B7D1" },
  { id: "twitter-post", name: "Twitter Post", category: "social", width: 1200, height: 675, bg: "#96CEB4" },
  { id: "linkedin-post", name: "LinkedIn Post", category: "social", width: 1200, height: 627, bg: "#FFEAA7" },
  { id: "pinterest-pin", name: "Pinterest Pin", category: "social", width: 1000, height: 1500, bg: "#DFE6E9" },
  { id: "youtube-thumbnail", name: "YouTube Thumbnail", category: "social", width: 1280, height: 720, bg: "#FAB1A0" },
  { id: "tiktok-video", name: "TikTok Cover", category: "social", width: 1080, height: 1920, bg: "#74B9FF" },
  
  // Marketing Templates
  { id: "fb-ad", name: "Facebook Ad", category: "marketing", width: 1200, height: 628, bg: "#A29BFE" },
  { id: "banner-wide", name: "Wide Banner", category: "marketing", width: 1920, height: 1080, bg: "#FD79A8" },
  { id: "banner-narrow", name: "Leaderboard", category: "marketing", width: 728, height: 90, bg: "#FDCB6E" },
  { id: "email-header", name: "Email Header", category: "marketing", width: 600, height: 200, bg: "#6C5CE7" },
  { id: "web-hero", name: "Website Hero", category: "marketing", width: 1920, height: 600, bg: "#00B894" },
  { id: "blog-feature", name: "Blog Feature", category: "marketing", width: 1200, height: 630, bg: "#E17055" },
  { id: "promo-square", name: "Promo Square", category: "marketing", width: 800, height: 800, bg: "#0984E3" },
  { id: "ad-skyscraper", name: "Skyscraper Ad", category: "marketing", width: 160, height: 600, bg: "#00CEC9" },
  
  // Presentation Templates
  { id: "slide-16-9", name: "Slide 16:9", category: "presentation", width: 1920, height: 1080, bg: "#2D3436" },
  { id: "slide-4-3", name: "Slide 4:3", category: "presentation", width: 1024, height: 768, bg: "#636E72" },
  { id: "presentation-cover", name: "Cover Slide", category: "presentation", width: 1920, height: 1080, bg: "#B2BEC3" },
  { id: "infographic-vertical", name: "Infographic", category: "presentation", width: 800, height: 2000, bg: "#DFE6E9" },
  { id: "certificate", name: "Certificate", category: "presentation", width: 1056, height: 816, bg: "#FFFFFF" },
  { id: "thank-you-slide", name: "Thank You Slide", category: "presentation", width: 1920, height: 1080, bg: "#F8F9FA" },
  
  // Print Templates
  { id: "flyer-letter", name: "Flyer (Letter)", category: "print", width: 816, height: 1056, bg: "#FFFFFF" },
  { id: "poster-18x24", name: "Poster 18×24", category: "print", width: 1296, height: 1728, bg: "#F5F5F5" },
  { id: "business-card", name: "Business Card", category: "print", width: 1050, height: 600, bg: "#E8E8E8" },
  { id: "postcard", name: "Postcard", category: "print", width: 1800, height: 1200, bg: "#FAFAFA" },
  { id: "brochure-cover", name: "Brochure", category: "print", width: 816, height: 1056, bg: "#FFFFFF" },
  { id: "menu", name: "Menu", category: "print", width: 1224, height: 1584, bg: "#F9F9F9" },
  { id: "invitation", name: "Invitation", category: "print", width: 1200, height: 1800, bg: "#FFF8F0" },
];

interface TemplateLibraryProps {
  onSelectTemplate: (template: Template) => void;
}

export const TemplateLibrary = ({ onSelectTemplate }: TemplateLibraryProps) => {
  const categories = Object.entries(TEMPLATE_CATEGORIES);

  return (
    <div className="h-full">
      <h3 className="font-semibold mb-3">Templates</h3>
      <Tabs defaultValue="social" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          {categories.map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(([key]) => (
          <TabsContent key={key} value={key} className="mt-3">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {TEMPLATES.filter(t => t.category === key).map(template => (
                  <Card
                    key={template.id}
                    className="p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {template.width} × {template.height}
                        </p>
                      </div>
                      <div
                        className="w-12 h-12 rounded border-2"
                        style={{ backgroundColor: template.bg }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
