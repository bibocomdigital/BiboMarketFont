import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  login,
  registerUser,
  requestPasswordReset,
  resetPassword,
  updateUserProfile,
  verifyCode,
  changePassword,
  type ProfileData,
} from "@/services/authService";
import { cartKeys, notificationKeys, orderKeys, userKeys } from "@/lib/query-keys";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    retry: false,
    onSuccess: (session) => {
      queryClient.setQueryData(userKeys.profile(), session.user);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (formData: FormData) => registerUser(formData),
    retry: false,
  });
}

export function useVerifyCodeMutation() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) => verifyCode(email, code),
    retry: false,
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: requestPasswordReset,
    retry: false,
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({
      email,
      code,
      newPassword,
    }: {
      email: string;
      code: string;
      newPassword: string;
    }) => resetPassword(email, code, newPassword),
    retry: false,
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => changePassword(currentPassword, newPassword),
    retry: false,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileData: ProfileData) => updateUserProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
}
