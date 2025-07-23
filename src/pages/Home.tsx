import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  };
}

const Home = () => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  const fetchPins = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pins:', error);
        toast({
          title: "Error",
          description: "Failed to load pins. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // For now, set pins without profile info - we'll add this later
      setPins((data || []).map(pin => ({
        ...pin,
        profiles: undefined
      })));
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen">
      <Header />
      <main className="pt-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {pins.length === 0 ? (
              <div className="container mx-auto px-4 py-16">
                <div className="text-center max-w-2xl mx-auto">
                  <div className="w-24 h-24 bg-soft-gray rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📌</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Your feed is waiting</h2>
                  <p className="text-muted-foreground mb-8 text-lg">
                    Start creating pins and boards to build your collection. Follow other users to see their content in your feed.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={() => navigate("/create-pin")}
                      className="rounded-full px-8"
                    >
                      Create your first pin
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/profile")}
                      className="rounded-full px-8"
                    >
                      View your profile
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <PinGrid pins={pins} onPinClick={handlePinClick} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Home;