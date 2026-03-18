import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook for optimistic UI updates with React Query
 * Handles rollback on error automatically
 */
export function useOptimisticUpdate({
  queryKey,
  mutationFn,
  updateFn,
  rollbackFn,
  onSuccess,
  onError,
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Get previous data for rollback
      const previousData = queryClient.getQueryData(queryKey);

      // Update UI optimistically
      if (updateFn && previousData) {
        queryClient.setQueryData(queryKey, (old) => updateFn(old, newData));
      }

      return { previousData };
    },
    onSuccess: (data, variables, context) => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey });
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Rollback to previous data
      if (context?.previousData) {
        if (rollbackFn) {
          queryClient.setQueryData(queryKey, rollbackFn);
        } else {
          queryClient.setQueryData(queryKey, context.previousData);
        }
      }
      onError?.(error, variables, context);
    },
  });

  return mutation;
}

/**
 * Optimistic update helpers for common actions
 */
export const optimisticHelpers = {
  // Like/Unlike
  toggleLike: (old, itemId, isLiking) => {
    if (!old) return old;
    return {
      ...old,
      likes: isLiking
        ? [...(old.likes || []), itemId]
        : (old.likes || []).filter(id => id !== itemId),
      total_likes: (old.total_likes || 0) + (isLiking ? 1 : -1),
    };
  },

  // Save/Unsave
  toggleSave: (old, itemId, isSaving) => {
    if (!old) return old;
    return {
      ...old,
      saved: isSaving
        ? [...(old.saved || []), itemId]
        : (old.saved || []).filter(id => id !== itemId),
    };
  },

  // Follow/Unfollow
  toggleFollow: (old, userId, isFollowing) => {
    if (!old) return old;
    return {
      ...old,
      followers: isFollowing
        ? [...(old.followers || []), userId]
        : (old.followers || []).filter(id => id !== userId),
      follower_count: (old.follower_count || 0) + (isFollowing ? 1 : -1),
    };
  },

  // Favorite/Unfavorite
  toggleFavorite: (old, itemId, isFavorite) => {
    if (!old) return old;
    return {
      ...old,
      is_favorite: isFavorite,
    };
  },

  // Toggle in list
  toggleInList: (old, itemId, isAdding) => {
    if (!Array.isArray(old)) return old;
    if (isAdding) {
      return old.some(item => item.id === itemId) ? old : [...old, { id: itemId }];
    }
    return old.filter(item => item.id !== itemId);
  },
};