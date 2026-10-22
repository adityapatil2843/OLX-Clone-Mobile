import { useQuery, useMutation } from '@tanstack/react-query';
import { reelsService, ListReelsQuery } from '../services/reels.service';
import { queryClient } from '../providers/QueryProvider';

export const REEL_QUERY_KEYS = {
  all: ['reels'] as const,
  feed: (params?: ListReelsQuery) => [...REEL_QUERY_KEYS.all, 'feed', params] as const,
  detail: (id: string) => [...REEL_QUERY_KEYS.all, 'detail', id] as const,
  comments: (id: string) => [...REEL_QUERY_KEYS.all, 'comments', id] as const,
};

export const useReelsQuery = (params?: ListReelsQuery) => {
  return useQuery({
    queryKey: REEL_QUERY_KEYS.feed(params),
    queryFn: () => reelsService.getReels(params),
  });
};

export const useReelDetailQuery = (id: string) => {
  return useQuery({
    queryKey: REEL_QUERY_KEYS.detail(id),
    queryFn: () => reelsService.getReelById(id),
    enabled: Boolean(id),
  });
};

export const useLikeReelMutation = () => {
  return useMutation({
    mutationFn: ({ reelId, isLiked }: { reelId: string; isLiked: boolean }) =>
      isLiked ? reelsService.unlikeReel(reelId) : reelsService.likeReel(reelId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.detail(variables.reelId) });
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.all });
    },
  });
};

export const useSaveReelMutation = () => {
  return useMutation({
    mutationFn: ({ reelId, isSaved }: { reelId: string; isSaved: boolean }) =>
      isSaved ? reelsService.unsaveReel(reelId) : reelsService.saveReel(reelId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.detail(variables.reelId) });
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.all });
    },
  });
};

export const useReelCommentsQuery = (reelId: string) => {
  return useQuery({
    queryKey: REEL_QUERY_KEYS.comments(reelId),
    queryFn: () => reelsService.getComments(reelId),
    enabled: Boolean(reelId),
  });
};

export const useAddReelCommentMutation = () => {
  return useMutation({
    mutationFn: ({ reelId, text }: { reelId: string; text: string }) =>
      reelsService.addComment(reelId, text),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.comments(variables.reelId) });
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.detail(variables.reelId) });
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.all });
    },
  });
};

export const useCreateReelMutation = () => {
  return useMutation({
    mutationFn: (payload: { title: string; description?: string; listingId?: string }) =>
      reelsService.createReel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REEL_QUERY_KEYS.all });
    },
  });
};
