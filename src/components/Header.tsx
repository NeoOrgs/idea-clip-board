import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Search, Plus, User, LogOut, Download, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const Header = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error) {
      setUserProfile(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  const downloadProfilePicture = async () => {
    if (!userProfile?.avatar_url) {
      toast({
        title: "No profile picture",
        description: "You don't have a profile picture to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(userProfile.avatar_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `profile-picture-${userProfile.full_name || user?.email || 'user'}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Downloaded!",
        description: "Your profile picture has been downloaded.",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Download failed",
        description: "Failed to download your profile picture.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-hero border-b border-border/20">
      <div className="container-premium h-18 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center space-x-3 cursor-pointer flex-shrink-0 hover-magnetic rounded-xl p-2" 
          onClick={() => navigate("/")}
        >
          <img 
            src="/lovable-uploads/dd15324d-eb74-4e88-9e81-b3dac66be0a1.png" 
            alt="PinBoard Logo" 
            className="w-10 h-10 hover:scale-110 transition-transform duration-300"
          />
          <span className="text-xl md:text-2xl font-bold hidden sm:block text-gradient">PinBoard</span>
        </div>

        {/* Search Bar (centered) */}
        <div className="flex-1 max-w-3xl mx-6 md:mx-10">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search for inspiring pins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-6 rounded-2xl border-2 border-border bg-background/80 backdrop-blur-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 hover:border-primary/20 transition-all duration-300 shadow-soft hover:shadow-card"
            />
          </form>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
          {user ? (
            <>
              <ThemeToggle />
              <Button 
                variant="glass" 
                size="sm"
                onClick={() => navigate("/create-pin")}
                className="rounded-2xl font-semibold"
              >
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Create</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:scale-110 transition-transform duration-300">
                    <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/40 transition-colors duration-300">
                      <AvatarImage src={userProfile?.avatar_url || ""} alt={userProfile?.full_name || user.email || ""} />
                      <AvatarFallback className="text-sm font-semibold bg-gradient-primary text-primary-foreground">
                        {(userProfile?.full_name || user.email || '').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  {userProfile?.avatar_url && (
                    <DropdownMenuItem onClick={downloadProfilePicture} className="cursor-pointer">
                      <Download className="mr-2 h-4 w-4" />
                      Download Profile Picture
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Button 
                variant="glass" 
                onClick={() => navigate("/auth")}
                className="rounded-2xl text-sm font-semibold"
                size="sm"
              >
                <span className="hidden md:inline">Log in</span>
                <span className="md:hidden">Login</span>
              </Button>
              <Button 
                variant="premium"
                onClick={() => navigate("/auth")}
                className="rounded-2xl text-sm font-semibold"
                size="sm"
              >
                <span className="hidden md:inline">Sign up</span>
                <span className="md:hidden">Join</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
