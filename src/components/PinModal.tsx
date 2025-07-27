import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, MoreVertical, User } from "lucide-react";
import ImageActions from "./ImageActions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import SavePinDialog from "./SavePinDialog";
import { useGSAP, gsapAnimations } from "@/hooks/useGSAP";

interface Pin {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  original_url?: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

interface PinModalProps {
  pin: Pin | null;
  isOpen: boolean;
  onClose: () => void;
  pinId?: string; // For dynamic routing
}

const PinModal = ({ pin, isOpen, onClose, pinId }: PinModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPin, setCurrentPin] = useState<Pin | null>(pin);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { gsap } = useGSAP();
  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle dynamic routing
  useEffect(() => {
    if (pinId && !pin) {
      fetchPinById(pinId);
    }
  }, [pinId]);

  // Handle URL changes for sharing
  useEffect(() => {
    if (pin && isOpen) {
      const newUrl = `/pin/${pin.id}`;
      if (location.pathname !== newUrl) {
        window.history.pushState({}, '', newUrl);
      }
    }
  }, [pin, isOpen, location.pathname]);

  useEffect(() => {
    if (currentPin && isOpen) {
      fetchComments();
      fetchLikes();
      checkIfLiked();
      animateModalEntrance();
    }
  }, [currentPin, isOpen]);

  // GSAP animations
  useEffect(() => {
    if (isOpen && modalRef.current) {
      animateModalEntrance();
    }
  }, [isOpen]);

  const fetchPinById = async (id: string) => {
    const { data: pinData, error } = await supabase
      .from('pins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching pin:', error);
      navigate('/');
      return;
    }

    // Fetch the profile separately
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('user_id', pinData.user_id)
      .single();

    const pinWithProfile = {
      ...pinData,
      profiles: profileData
    };

    setCurrentPin(pinWithProfile);
  };

  const animateModalEntrance = () => {
    if (!modalRef.current || !imageRef.current || !contentRef.current) return;

    const tl = gsap.timeline();

    // Modal backdrop fade in
    tl.fromTo(modalRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.3, ease: "power2.out" }
    );

    // Image scale in
    tl.fromTo(imageRef.current,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" },
      "-=0.2"
    );

    // Content slide in from right
    tl.fromTo(contentRef.current,
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      "-=0.4"
    );

    // Stagger animate comment cards
    const commentCards = contentRef.current.querySelectorAll('.comment-card');
    if (commentCards.length > 0) {
      gsapAnimations.staggerFadeIn(commentCards, 0.1);
    }
  };

  const handleClose = () => {
    if (location.pathname.startsWith('/pin/')) {
      navigate('/');
    }
    onClose();
  };

  const fetchComments = async () => {
    const activePin = currentPin || pin;
    if (!activePin) return;

    const { data: commentsData, error } = await supabase
      .from('comments')
      .select('*')
      .eq('pin_id', activePin.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    // Fetch profiles for each comment
    if (commentsData && commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);
      
      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id)
      }));

      setComments(commentsWithProfiles);
    } else {
      setComments([]);
    }
  };

  const fetchLikes = async () => {
    const activePin = currentPin || pin;
    if (!activePin) return;

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('pin_id', activePin.id);

    setLikesCount(count || 0);
  };

  const checkIfLiked = async () => {
    const activePin = currentPin || pin;
    if (!activePin) return;

    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('pin_id', activePin.id)
      .eq('user_id', session.session.user.id)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const toggleLike = async () => {
    const activePin = currentPin || pin;
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user || !activePin) return;

    if (isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('pin_id', activePin.id)
        .eq('user_id', session.session.user.id);

      if (!error) {
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({
          pin_id: activePin.id,
          user_id: session.session.user.id
        });

      if (!error) {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    }
  };

  const addComment = async () => {
    const activePin = currentPin || pin;
    if (!newComment.trim() || !activePin) return;

    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        pin_id: activePin.id,
        user_id: session.session.user.id,
        content: newComment.trim()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      fetchComments();
    }
    setLoading(false);
  };

  const displayPin = currentPin || pin;
  if (!displayPin) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent ref={modalRef} className="max-w-4xl max-h-[90vh] p-0 overflow-hidden glass">
          <div className="flex h-full">
            {/* Image Section */}
            <div className="flex-1 bg-background/95 flex items-center justify-center">
              <img
                ref={imageRef}
                src={displayPin.image_url}
                alt={displayPin.title}
                className="max-w-full max-h-full object-contain transition-transform hover:scale-105"
              />
            </div>

            {/* Content Section */}
            <div ref={contentRef} className="w-96 flex flex-col bg-background/95 backdrop-blur-sm smooth-scroll">
              {/* Header */}
              <div className="p-4 border-b animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    className="rounded-full hover:shadow-lg transition-all hover-scale"
                  >
                    Save
                  </Button>
                  <div className="flex items-center space-x-2">
                    <ImageActions imageUrl={displayPin.image_url} title={displayPin.title} />
                  </div>
                </div>

                <div className="flex items-center space-x-3 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full p-2 hover-scale transition-colors"
                    onClick={toggleLike}
                  >
                    <Heart className={`h-5 w-5 transition-all ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'hover:text-red-400'}`} />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full p-2 hover-scale">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full p-2 hover-scale">
                    <Share className="h-5 w-5" />
                  </Button>
                </div>

                {likesCount > 0 && (
                  <p className="text-sm font-medium mb-2 animate-fade-in">{likesCount} likes</p>
                )}

                <h2 className="text-xl font-bold mb-2 animate-fade-in">{displayPin.title}</h2>
                {displayPin.description && (
                  <p className="text-muted-foreground text-sm mb-3 animate-fade-in leading-relaxed">{displayPin.description}</p>
                )}

                <div className="flex items-center space-x-2 animate-fade-in">
                  <Avatar 
                    className="h-8 w-8 cursor-pointer transition-transform hover:scale-110"
                    onClick={() => navigate(`/user/${displayPin.user_id}`)}
                  >
                    <AvatarImage src={displayPin.profiles?.avatar_url} />
                    <AvatarFallback>
                      {(displayPin.profiles?.full_name || displayPin.profiles?.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span 
                    className="text-sm font-medium cursor-pointer story-link transition-colors"
                    onClick={() => navigate(`/user/${displayPin.user_id}`)}
                  >
                    {displayPin.profiles?.full_name || displayPin.profiles?.email || 'Anonymous'}
                  </span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="flex-1 flex flex-col p-4 min-h-0">
                <h3 className="font-medium mb-3 animate-fade-in">Comments</h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
                  {comments.map((comment, index) => (
                    <Card 
                      key={comment.id} 
                      className="comment-card p-3 animate-fade-in hover-scale border-0 bg-muted/20 transition-all"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start space-x-2">
                        <Avatar 
                          className="h-6 w-6 cursor-pointer transition-transform hover:scale-110"
                          onClick={() => navigate(`/user/${comment.user_id}`)}
                        >
                          <AvatarImage src={comment.profiles?.avatar_url} />
                          <AvatarFallback>
                            {(comment.profiles?.full_name || comment.profiles?.email || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span 
                              className="text-sm font-medium cursor-pointer story-link transition-colors"
                              onClick={() => navigate(`/user/${comment.user_id}`)}
                            >
                              {comment.profiles?.full_name || comment.profiles?.email || 'Anonymous'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at))} ago
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Add Comment - Fixed positioning with animations */}
                <div className="flex-shrink-0 border-t pt-4 space-y-3 animate-fade-in">
                  <div className="flex justify-end">
                    <Button 
                      onClick={addComment} 
                      disabled={!newComment.trim() || loading}
                      size="sm"
                      className="rounded-full px-6 transition-all hover:shadow-md"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Posting...
                        </>
                      ) : (
                        'Post'
                      )}
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none transition-all focus:ring-2 focus:ring-primary/20 border-muted"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SavePinDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        pinId={displayPin.id}
        pinTitle={displayPin.title}
      />
    </>
  );
};

export default PinModal;