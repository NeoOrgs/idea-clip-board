import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import Header from "@/components/Header";
import PinGrid from "@/components/PinGrid";
import PinModal from "@/components/PinModal";
import ParticleMorphism from "@/components/ParticleMorphism";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

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
    avatar_url?: string;
  };
}

const Home = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const { pinId } = useParams();
  const searchQuery = searchParams.get('search');
  const [session, setSession] = useState<Session | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePinDeleted = (pinId: string) => {
    setPins(prev => prev.filter(pin => pin.id !== pinId));
    toast({
      title: "Pin deleted",
      description: "Pin has been removed from your view.",
    });
  };

  // Check if we're on a pin route
  useEffect(() => {
    if (pinId) {
      setShowPinModal(true);
    }
  }, [pinId]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchPins();
  }, [searchQuery]);

  const fetchPins = async () => {
    setLoading(true);
    
    let query = supabase
      .from('pins')
      .select('*');

    if (searchQuery) {
      // Use ilike for basic text search
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data: pinsData, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pins:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles for pins
    if (pinsData && pinsData.length > 0) {
      const userIds = [...new Set(pinsData.map(pin => pin.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);
      
      const pinsWithProfiles = pinsData.map(pin => ({
        ...pin,
        profiles: profilesMap.get(pin.user_id)
      }));

      setPins(pinsWithProfiles);
    } else {
      setPins([]);
    }
    
    setLoading(false);
  };


  if (!session) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleMorphism particleCount={800} mouseInteraction={true} />
        <Header />
        <main className="container mx-auto px-4 py-8 relative z-10">
          {/* Hero Section */}
          <div className="text-center py-20 max-w-6xl mx-auto">
            <div className="mb-8 animate-fade-in">
              <span className="inline-block px-6 py-3 rounded-full glass-morphism text-primary text-sm font-medium mb-8 floating-card">
                ✨ Discover & Save Ideas
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold mb-8 aurora-text leading-tight animate-scale-in">
              Save ideas you love
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-4xl mx-auto animate-fade-in">
              Collect your favorites so you can get back to them later. Create beautiful boards to organize your pins by theme and inspiration with our award-winning interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-in-right">
              <Button 
                variant="premium"
                size="lg"
                onClick={() => navigate("/auth")}
                className="rounded-full px-12 py-8 text-xl font-semibold shadow-glow"
              >
                Get Started Free
              </Button>
              <Button 
                variant="glass"
                size="lg" 
                onClick={() => navigate("/auth")}
                className="rounded-full px-12 py-8 text-xl font-semibold"
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="premium-grid mb-16 max-w-7xl mx-auto">
            <div className="glass-morphism p-8 rounded-2xl floating-card text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎨</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Creative Collections</h3>
              <p className="text-muted-foreground">Organize your ideas into beautiful, themed boards</p>
            </div>
            <div className="glass-morphism p-8 rounded-2xl floating-card text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">Save and access your pins instantly</p>
            </div>
            <div className="glass-morphism p-8 rounded-2xl floating-card text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌟</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Award-Winning Design</h3>
              <p className="text-muted-foreground">Beautiful, modern interface with 3D interactions</p>
            </div>
          </div>

          {/* Sample pins for logged out users */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-primary/30"></div>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 aurora-text">
                  Discover inspiring ideas
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Explore beautiful pins from our community and get inspired for your next project
                </p>
              </div>
              <div className="glass-morphism rounded-3xl p-8">
                <PinGrid pins={pins.slice(0, 12)} currentUserId={session?.user?.id} />
              </div>
              {pinId && (
                <PinModal
                  pin={null}
                  pinId={pinId}
                  isOpen={showPinModal}
                  onClose={() => {
                    setShowPinModal(false);
                    navigate('/');
                  }}
                />
              )}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleMorphism particleCount={600} mouseInteraction={true} />
      <div className="gradient-warm absolute inset-0 opacity-50 -z-10" />
      <Header />
      <main className="py-8 relative z-10">
        {searchQuery && (
          <div className="container mx-auto px-4 mb-8">
            <div className="glass-morphism p-6 rounded-2xl">
              <h2 className="text-2xl font-bold aurora-text">Search results for "{searchQuery}"</h2>
              <p className="text-muted-foreground text-lg">{pins.length} pins found</p>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <div className="absolute inset-0 w-12 h-12 border border-primary/30 rounded-full animate-ping mx-auto"></div>
              </div>
              <p className="text-muted-foreground text-lg">Loading your amazing pins...</p>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4">
            <div className="glass-morphism rounded-3xl p-8">
              <PinGrid 
                pins={pins} 
                currentUserId={session?.user?.id}
                onPinDeleted={handlePinDeleted}
              />
            </div>
          </div>
        )}
        
        {pinId && (
          <PinModal
            pin={null}
            pinId={pinId}
            isOpen={showPinModal}
            onClose={() => {
              setShowPinModal(false);
              navigate('/');
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Home;