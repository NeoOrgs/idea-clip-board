-- Fix security issue: Set search_path for the function
CREATE OR REPLACE FUNCTION public.update_user_preferences()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;