-- Create table to track user interactions for personalized feeds
CREATE TABLE public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pin_id UUID NOT NULL,
  interaction_type TEXT NOT NULL, -- 'save', 'click', 'search', 'like'
  search_query TEXT, -- for search interactions
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own interactions" 
ON public.user_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own interactions" 
ON public.user_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_user_interactions_pin_id ON public.user_interactions(pin_id);
CREATE INDEX idx_user_interactions_type ON public.user_interactions(interaction_type);
CREATE INDEX idx_user_interactions_created_at ON public.user_interactions(created_at);

-- Create table for user preferences (aggregated data)
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_keywords TEXT[],
  interaction_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update user preferences based on interactions
CREATE OR REPLACE FUNCTION public.update_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert user preferences
  INSERT INTO public.user_preferences (user_id, interaction_count, last_updated)
  VALUES (NEW.user_id, 1, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    interaction_count = user_preferences.interaction_count + 1,
    last_updated = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update preferences when interactions are added
CREATE TRIGGER update_preferences_on_interaction
AFTER INSERT ON public.user_interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_preferences();