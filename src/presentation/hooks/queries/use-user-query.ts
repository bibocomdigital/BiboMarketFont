import { useQuery } from "@tanstack/react-query";
import { getAdminUsers, getUserById, getUserProfile } from "@/services/authService";
import { getUserNotifications } from "@/services/notificationService";
import { checkIfFollowing, getUserFollowers, getUserFollowing } from "@/services/subscriptionService";
import { isLoggedIn } from "@/services/configService";
import { notificationKeys, userKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";

export function useProfileQuery() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => withTimeout(getUserProfile()),
    enabled: typeof window !== "undefined" && isLoggedIn(),
    staleTime: 2 * 60_000,
  });
}

export function useUserByIdQuery(userId: string | number | null, enabled = true) {
  return useQuery({
    queryKey: userKeys.detail(userId ?? 0),
    queryFn: () => withTimeout(getUserById(userId as string | number)),
    enabled: enabled && userId !== null && userId !== undefined && userId !== "",
    staleTime: 2 * 60_000,
  });
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => withTimeout(getUserNotifications()),
    enabled: typeof window !== "undefined" && isLoggedIn(),
    staleTime: 20_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
  });
}

export function useFollowersQuery(userId: number | null) {
  return useQuery({
    queryKey: userKeys.followers(userId ?? 0),
    queryFn: () => withTimeout(getUserFollowers(userId as number, 1, 20)),
    enabled: userId !== null && userId > 0,
    staleTime: 60_000,
  });
}

export function useFollowingQuery(userId: number | null) {
  return useQuery({
    queryKey: userKeys.following(userId ?? 0),
    queryFn: () => withTimeout(getUserFollowing(userId as number, 1, 20)),
    enabled: userId !== null && userId > 0,
    staleTime: 60_000,
  });
}

export function useFollowStatusQuery(userId: number | null, enabled = true) {
  return useQuery({
    queryKey: userKeys.followStatus(userId ?? 0),
    queryFn: () => withTimeout(checkIfFollowing(userId as number)),
    enabled: enabled && userId !== null && userId > 0 && typeof window !== "undefined" && isLoggedIn(),
    staleTime: 30_000,
  });
}

export function useAdminUsersQuery(enabled = true) {
  return useQuery({
    queryKey: userKeys.adminList(),
    queryFn: () => withTimeout(getAdminUsers()),
    enabled: enabled && typeof window !== "undefined" && isLoggedIn(),
    staleTime: 30_000,
  });
}
