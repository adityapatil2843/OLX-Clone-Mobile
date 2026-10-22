import { useQuery, useMutation } from '@tanstack/react-query';
import { userService, UpdateProfilePayload } from '../services/user.service';
import { queryClient } from '../providers/QueryProvider';
import { useAuthStore } from '../stores/useAuthStore';

export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  profile: (userId: string) => [...USER_QUERY_KEYS.all, 'profile', userId] as const,
};

export const useUserProfileQuery = (userId: string) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.profile(userId),
    queryFn: () => userService.getUserProfile(userId),
    enabled: Boolean(userId),
  });
};

export const useUpdateProfileMutation = () => {
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateProfilePayload }) =>
      userService.updateProfile(userId, payload),
    onSuccess: (updatedUser, variables) => {
      queryClient.setQueryData(USER_QUERY_KEYS.profile(variables.userId), updatedUser);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.id === variables.userId) {
        useAuthStore.getState().setSession(updatedUser);
      }
    },
  });
};
