import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, MoreVertical, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import SavePinDialog from "./SavePinDialog";
import { useUserInteractions } from "@/hooks/useUserInteractions";
import { downloadImage } from "@/utils/imageUtils";

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
}

const PinModal = ({ pin, isOpen, onClose }: PinModalProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logInteraction } = useUserInteractions();

  const handleDownload = async () => {
    const success = await downloadImage(pin.image_url, `${pin.title.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (success) {
      toast({
        title: "Success",
        description: "Image downloaded successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (pin && isOpen) {
      fetchComments();
      fetchLikes();
      checkIfLiked();
    }
  }, [pin, isOpen]);

  const fetchComments = async () => {
    if (!pin) return;

    const { data: commentsData, error } = await supabase
      .from('comments')
      .select('*')
      .eq('pin_id', pin.id)
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
    if (!pin) return;

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('pin_id', pin.id);

    setLikesCount(count || 0);
  };

  const checkIfLiked = async () => {
    if (!pin) return;

    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('pin_id', pin.id)
      .eq('user_id', session.session.user.id)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const toggleLike = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user || !pin) return;

    if (isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('pin_id', pin.id)
        .eq('user_id', session.session.user.id);

      if (!error) {
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({
          pin_id: pin.id,
          user_id: session.session.user.id
        });

      if (!error) {
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        // Log like interaction
        logInteraction({ pinId: pin.id, type: 'like' });
      }
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !pin) return;

    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        pin_id: pin.id,
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

  if (!pin) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="flex h-full">
            {/* Image Section */}
            <div className="flex-1 bg-black flex items-center justify-center">
              <img
                src={pin.image_url}
                alt={pin.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Content Section */}
            <div className="w-96 flex flex-col bg-background">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    className="rounded-full"
                  >
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-3 mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full p-2"
                    onClick={toggleLike}
                  >
                    <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full p-2">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full p-2"
                    onClick={handleDownload}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full p-2">
                    <Share className="h-5 w-5" />
                  </Button>
                </div>

                {likesCount > 0 && (
                  <p className="text-sm font-medium mb-2">{likesCount} likes</p>
                )}

                <h2 className="text-xl font-bold mb-2">{pin.title}</h2>
                {pin.description && (
                  <p className="text-muted-foreground text-sm mb-3">{pin.description}</p>
                )}

                <div className="flex items-center space-x-2">
                  <Avatar 
                    className="h-8 w-8 cursor-pointer"
                    onClick={() => navigate(`/user/${pin.user_id}`)}
                  >
                    <AvatarImage src={pin.profiles?.avatar_url} />
                    <AvatarFallback>
                      {(pin.profiles?.full_name || pin.profiles?.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span 
                    className="text-sm font-medium cursor-pointer hover:underline"
                    onClick={() => navigate(`/user/${pin.user_id}`)}
                  >
                    {pin.profiles?.full_name || pin.profiles?.email || 'Anonymous'}
                  </span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="flex-1 flex flex-col p-4">
                <h3 className="font-medium mb-3">Comments</h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {comments.map((comment) => (
                    <Card key={comment.id} className="p-3">
                      <div className="flex items-start space-x-2">
                        <Avatar 
                          className="h-6 w-6 cursor-pointer"
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
                              className="text-sm font-medium cursor-pointer hover:underline"
                              onClick={() => navigate(`/user/${comment.user_id}`)}
                            >
                              {comment.profiles?.full_name || comment.profiles?.email || 'Anonymous'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at))} ago
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none"
                    rows={2}
                  />
                  <Button 
                    onClick={addComment} 
                    disabled={!newComment.trim() || loading}
                    size="sm"
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SavePinDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        pinId={pin.id}
        pinTitle={pin.title}
      />
    </>
  );
};

export default PinModal;