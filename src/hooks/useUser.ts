import { useQuery, useMutation } from '@tanstack/react-query';
import { userService, UpdateProfilePayload } from '../services/user.service';
import { mediaService } from '../services/media.service';
import { authService } from '../services/auth.service';
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

export const useUploadAvatarMutation = () => {
  return useMutation({
    mutationFn: ({
      userId,
      imageUri,
      fileName,
      mimeType,
    }: {
      userId: string;
      imageUri: string;
      fileName?: string;
      mimeType?: string;
    }) => mediaService.uploadAvatar(userId, imageUri, { fileName, mimeType }),
    onSuccess: (response, variables) => {
      const updatedUser = response?.data || response;
      if (updatedUser && updatedUser.id) {
        queryClient.setQueryData(USER_QUERY_KEYS.profile(variables.userId), updatedUser);
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.id === variables.userId) {
          useAuthStore.getState().setSession(updatedUser);
        }
      } else {
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.profile(variables.userId) });
      }
    },
  });
};

export const useDeleteUserAccountMutation = () => {
  return useMutation({
    mutationFn: (userId: string) => userService.deleteUserAccount(userId),
    onSuccess: async () => {
      await authService.logout();
      queryClient.clear();
    },
  });
};
