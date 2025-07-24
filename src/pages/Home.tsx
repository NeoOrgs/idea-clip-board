import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import PinGrid from "@/components/PinGrid";
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
  const searchQuery = searchParams.get('search');
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handlePinClick = (pin: Pin) => {
    navigate(`/pin/${pin.id}`);
  };

  if (!session) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center py-16 max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-pinterest-red bg-clip-text text-transparent">
              Save ideas you like
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Collect your favorites so you can get back to them later. Create boards to organize your pins by theme.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate("/auth")}
                className="rounded-full px-8"
              >
                Sign up
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                onClick={() => navigate("/auth")}
                className="rounded-full px-8"
              >
                Log in
              </Button>
            </div>
          </div>

          {/* Sample pins for logged out users */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-center mb-8">
                Discover inspiring ideas
              </h2>
              <PinGrid pins={pins.slice(0, 12)} onPinClick={handlePinClick} />
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        {searchQuery && (
          <div className="container mx-auto px-4 mb-6">
            <h2 className="text-xl font-semibold">Search results for "{searchQuery}"</h2>
            <p className="text-muted-foreground">{pins.length} pins found</p>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading pins...</p>
            </div>
          </div>
        ) : (
          <PinGrid pins={pins} />
        )}
      </main>
    </div>
  );
};

export default Home;