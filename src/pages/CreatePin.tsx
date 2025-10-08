import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Upload, Link } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface Board {
  id: string;
  name: string;
  description?: string;
}

const CreatePin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNsfw, setIsNsfw] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication and redirect if not logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setSession(session);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setSession(session);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchBoards();
    }
  }, [session]);

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', session?.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching boards:', error);
        return;
      }

      setBoards(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMultipleImageUpload = async (files: File[]) => {
    setIsUploading(true);
    setError("");
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `pins/${session?.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pin-images')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('pin-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      setImageUrls(uploadedUrls);
      toast({
        title: "Images uploaded!",
        description: `${uploadedUrls.length} image(s) uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || "Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(files);
      handleMultipleImageUpload(files);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);
    setError("");

    try {
      const imagesToUpload = imageUrls.length > 0 ? imageUrls : [imageUrl];
      
      if (!title || imagesToUpload.length === 0 || imagesToUpload[0] === "" || !selectedBoard) {
        throw new Error("Please fill in all required fields");
      }

      // Create multiple pins for multiple images
      const pinsToInsert = imagesToUpload.map(imgUrl => ({
        title,
        description,
        image_url: imgUrl,
        original_url: originalUrl || null,
        board_id: selectedBoard,
        user_id: session.user.id,
        is_nsfw: isNsfw
      }));

      const { error } = await supabase
        .from('pins')
        .insert(pinsToInsert);

      if (error) {
        throw error;
      }

      toast({
        title: `${pinsToInsert.length} Pin(s) created!`,
        description: "Your pins have been saved successfully.",
      });

      navigate("/");
    } catch (error: any) {
      console.error('Error creating pin:', error);
      setError(error.message || "Failed to create pins");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-soft-gray">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
          
          <h1 className="text-3xl font-bold">Create Pin</h1>
          <p className="text-muted-foreground mt-2">Save something you love</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Pin Details</CardTitle>
            <CardDescription>
              Add an image and details about your pin
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload Section */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Images</Label>
                
                {imageUrls.length === 0 && !imageUrl ? (
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/40 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="image-upload"
                        disabled={isUploading}
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">
                          {isUploading ? "Uploading..." : "Choose files"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Select multiple images to upload to the same board
                        </p>
                      </label>
                    </div>
                    
                    <div className="text-center text-muted-foreground">or</div>
                    
                    {/* URL Input */}
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl" className="flex items-center">
                        <Link className="h-4 w-4 mr-2" />
                        Image URL (single image)
                      </Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {imageUrls.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg shadow-soft"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full max-w-md mx-auto rounded-lg shadow-soft"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setImageUrl("")}
                          className="absolute top-2 right-2"
                        >
                          Change
                        </Button>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setImageUrls([]);
                        setImageFiles([]);
                        setImageUrl("");
                      }}
                      className="w-full rounded-xl"
                    >
                      Clear All & Upload New
                    </Button>
                  </div>
                )}
              </div>

              {/* Pin Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Add a title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell everyone what your pin is about"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalUrl">Link</Label>
                  <Input
                    id="originalUrl"
                    type="url"
                    placeholder="Add a destination link"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="board">Board *</Label>
                  <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose a board" />
                    </SelectTrigger>
                    <SelectContent>
                      {boards.map((board) => (
                        <SelectItem key={board.id} value={board.id}>
                          {board.name}
                        </SelectItem>
                      ))}
                      {boards.length === 0 && (
                        <SelectItem value="none" disabled>
                          No boards found - create one first
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {boards.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      You need to create a board first.{" "}
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-primary"
                        onClick={() => navigate("/profile")}
                      >
                        Go to your profile
                      </Button>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="nsfw"
                    checked={isNsfw}
                    onCheckedChange={(checked) => setIsNsfw(!!checked)}
                  />
                  <Label htmlFor="nsfw" className="text-sm font-normal">
                    Mark as NSFW (Adult content)
                  </Label>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={loading || isUploading || (imageUrls.length === 0 && !imageUrl) || !title || !selectedBoard}
                  className="flex-1 rounded-xl"
                >
                  {loading ? "Creating..." : imageUrls.length > 1 ? `Create ${imageUrls.length} Pins` : "Create Pin"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreatePin;