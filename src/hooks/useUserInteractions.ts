import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type InteractionType = 'save' | 'click' | 'search' | 'like';

interface LogInteractionParams {
  pinId: string;
  type: InteractionType;
  searchQuery?: string;
}

export const useUserInteractions = () => {
  const logInteraction = useCallback(async ({ pinId, type, searchQuery }: LogInteractionParams) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return;

      const { error } = await supabase
        .from('user_interactions')
        .insert({
          user_id: session.session.user.id,
          pin_id: pinId,
          interaction_type: type,
          search_query: searchQuery
        });

      if (error) {
        console.error('Error logging interaction:', error);
      }
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  }, []);

  const logSearch = useCallback(async (searchQuery: string, relevantPinIds: string[] = []) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return;

      // Log search interaction for each relevant pin (or a dummy pin if no results)
      const pinIdsToLog = relevantPinIds.length > 0 ? relevantPinIds : ['00000000-0000-0000-0000-000000000000'];
      
      const interactions = pinIdsToLog.map(pinId => ({
        user_id: session.session!.user.id,
        pin_id: pinId,
        interaction_type: 'search' as const,
        search_query: searchQuery
      }));

      const { error } = await supabase
        .from('user_interactions')
        .insert(interactions);

      if (error) {
        console.error('Error logging search:', error);
      }
    } catch (error) {
      console.error('Error logging search:', error);
    }
  }, []);

  return {
    logInteraction,
    logSearch
  };
};