import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface PinModalCommentsProps {
  comments: Comment[];
  pinId: string;
  onCommentsUpdate: () => void;
}

const PinModalComments = ({ comments, pinId, onCommentsUpdate }: PinModalCommentsProps) => {
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const addComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        pin_id: pinId,
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
      onCommentsUpdate();
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Comments header */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group">
              <div className="flex gap-3">
                <Avatar 
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => navigate(`/user/${comment.user_id}`)}
                >
                  <AvatarImage src={comment.profiles?.avatar_url} />
                  <AvatarFallback>
                    {(comment.profiles?.full_name || comment.profiles?.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
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
            </div>
          ))
        )}
      </div>

      {/* Add comment */}
      <div className="p-6 border-t bg-muted/30">
        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="resize-none border-0 bg-background shadow-sm"
            rows={3}
          />
          <div className="flex justify-end">
            <Button 
              onClick={addComment} 
              disabled={!newComment.trim() || loading}
              className="rounded-full px-6"
            >
              {loading ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinModalComments;