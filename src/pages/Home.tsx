import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import Header from "@/components/Header";
import PinGrid from "@/components/PinGrid";
import PinModal from "@/components/PinModal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Heart } from "lucide-react";

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
      <div className="min-h-screen gradient-warm">
        <Header />
        <main className="container-premium section-spacing">
          {/* Hero Section */}
          <div className="text-center max-w-6xl mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-3xl blur-3xl -z-10"></div>
            
            <div className="mb-10 animate-bounce-subtle">
              <span className="inline-flex items-center px-6 py-3 rounded-full glass-card text-primary text-sm font-semibold mb-8 hover-lift">
                <span className="animate-pulse mr-2">✨</span>
                Discover & Save Ideas
              </span>
            </div>
            
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-10 text-gradient leading-tight tracking-tight animate-float-slow">
              Save ideas
              <br />
              <span className="text-glow">you love</span>
            </h1>
            
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-12 leading-relaxed max-w-4xl mx-auto font-medium">
              Collect your favorites so you can get back to them later. Create 
              <span className="text-foreground font-semibold"> beautiful boards </span>
              to organize your pins by theme and inspiration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button 
                variant="premium"
                size="xl"
                onClick={() => navigate("/auth")}
                className="min-w-[200px] font-bold shadow-glow"
              >
                Get Started Free
              </Button>
              <Button 
                variant="glass"
                size="xl" 
                onClick={() => navigate("/auth")}
                className="min-w-[200px] font-bold"
              >
                Sign In
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
              <div className="glass-card p-8 rounded-3xl hover-lift">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Plus className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-4">Easy to Save</h3>
                <p className="text-muted-foreground">Save any idea from the web with our browser extension or by uploading directly</p>
              </div>
              
              <div className="glass-card p-8 rounded-3xl hover-lift">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Search className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-4">Smart Search</h3>
                <p className="text-muted-foreground">Find your saved pins instantly with our powerful search and organization tools</p>
              </div>
              
              <div className="glass-card p-8 rounded-3xl hover-lift">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Heart className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-4">Get Inspired</h3>
                <p className="text-muted-foreground">Discover millions of ideas and connect with a creative community worldwide</p>
              </div>
            </div>
          </div>

          {/* Sample pins for logged out users */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
                  <div className="absolute inset-0 w-16 h-16 border-2 border-primary/10 rounded-full animate-pulse mx-auto"></div>
                </div>
                <p className="text-muted-foreground font-medium">Loading inspiration...</p>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-gradient">
                  Discover inspiring ideas
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
                  Explore beautiful pins from our community and get inspired for your next project
                </p>
              </div>
              <PinGrid pins={pins.slice(0, 12)} currentUserId={session?.user?.id} />
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
    <div className="min-h-screen gradient-warm">
      <Header />
      <main className="py-12">
        {searchQuery && (
          <div className="container-premium mb-10">
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-2xl font-bold mb-2">Search results for "{searchQuery}"</h2>
              <p className="text-muted-foreground text-lg">
                <span className="font-semibold text-primary">{pins.length}</span> pins found
              </p>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-2 border-primary/10 rounded-full animate-ping mx-auto"></div>
              </div>
              <p className="text-muted-foreground font-medium text-lg">Loading your pins...</p>
            </div>
          </div>
        ) : (
          <div className="container-premium">
            <PinGrid 
              pins={pins} 
              currentUserId={session?.user?.id}
              onPinDeleted={handlePinDeleted}
            />
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