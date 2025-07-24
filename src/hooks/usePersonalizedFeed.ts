import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const usePersonalizedFeed = () => {
  const [personalizedPins, setPersonalizedPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);

  const getPersonalizedFeed = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        // For non-authenticated users, return regular feed
        const { data: pins } = await supabase
          .from('pins')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (pins) {
          const userIds = [...new Set(pins.map(pin => pin.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, avatar_url')
            .in('user_id', userIds);

          const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);
          
          const pinsWithProfiles = pins.map(pin => ({
            ...pin,
            profiles: profilesMap.get(pin.user_id)
          }));

          setPersonalizedPins(pinsWithProfiles);
        }
        setLoading(false);
        return;
      }

      // Get user interactions to understand preferences
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('pin_id, interaction_type, search_query')
        .eq('user_id', session.session.user.id)
        .order('created_at', { ascending: false });

      if (!interactions || interactions.length === 0) {
        // No interactions yet, return trending/popular pins
        const { data: pins } = await supabase
          .from('pins')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (pins) {
          const userIds = [...new Set(pins.map(pin => pin.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, avatar_url')
            .in('user_id', userIds);

          const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);
          
          const pinsWithProfiles = pins.map(pin => ({
            ...pin,
            profiles: profilesMap.get(pin.user_id)
          }));

          setPersonalizedPins(pinsWithProfiles);
        }
        setLoading(false);
        return;
      }

      // Extract keywords from search queries and liked/saved pins
      const searchQueries = interactions
        .filter(i => i.interaction_type === 'search' && i.search_query)
        .map(i => i.search_query!)
        .join(' ');

      const interactedPinIds = interactions
        .filter(i => ['save', 'like'].includes(i.interaction_type))
        .map(i => i.pin_id);

      // Get pins user has interacted with to understand their taste
      let relatedKeywords: string[] = [];
      if (interactedPinIds.length > 0) {
        const { data: interactedPins } = await supabase
          .from('pins')
          .select('title, description')
          .in('id', interactedPinIds);

        if (interactedPins) {
          const allText = interactedPins
            .map(pin => `${pin.title} ${pin.description || ''}`)
            .join(' ');
          relatedKeywords = extractKeywords(allText);
        }
      }

      // Combine search keywords with content keywords
      const allKeywords = [...extractKeywords(searchQueries), ...relatedKeywords];
      const uniqueKeywords = [...new Set(allKeywords)];

      // Find similar pins based on keywords
      let recommendedPins: Pin[] = [];
      if (uniqueKeywords.length > 0) {
        const { data: pins } = await supabase
          .from('pins')
          .select('*')
          .not('id', 'in', `(${interactedPinIds.join(',')}${interactedPinIds.length === 0 ? 'null' : ''})`) // Exclude already interacted pins
          .order('created_at', { ascending: false })
          .limit(50); // Get more to filter from

        if (pins) {
          // Score pins based on keyword matches
          const scoredPins = pins.map(pin => {
            const pinText = `${pin.title} ${pin.description || ''}`.toLowerCase();
            const score = uniqueKeywords.reduce((acc, keyword) => {
              return acc + (pinText.includes(keyword.toLowerCase()) ? 1 : 0);
            }, 0);
            return { ...pin, score };
          });

          // Sort by score and take top pins
          recommendedPins = scoredPins
            .filter(pin => pin.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 15);

          // If not enough personalized pins, fill with recent pins
          if (recommendedPins.length < 15) {
            const recentPins = scoredPins
              .filter(pin => pin.score === 0)
              .slice(0, 15 - recommendedPins.length);
            recommendedPins = [...recommendedPins, ...recentPins];
          }
        }
      }

      // Fallback to recent pins if no recommendations
      if (recommendedPins.length === 0) {
        const { data: pins } = await supabase
          .from('pins')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        recommendedPins = pins || [];
      }

      // Fetch profiles for recommended pins
      if (recommendedPins.length > 0) {
        const userIds = [...new Set(recommendedPins.map(pin => pin.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', userIds);

        const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);
        
        const pinsWithProfiles = recommendedPins.map(pin => ({
          ...pin,
          profiles: profilesMap.get(pin.user_id)
        }));

        setPersonalizedPins(pinsWithProfiles);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching personalized feed:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getPersonalizedFeed();
  }, [getPersonalizedFeed]);

  return {
    personalizedPins,
    loading,
    refreshFeed: getPersonalizedFeed
  };
};

// Helper function to extract keywords from text
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2) // Filter out short words
    .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'an', 'a', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'].includes(word))
    .slice(0, 10); // Limit to top 10 keywords
}