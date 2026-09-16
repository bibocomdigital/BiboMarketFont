import { useQuery } from "@tanstack/react-query";
import { getConversations, getMessages, getUnreadCount, hasExistingConversation, searchMessages } from "@/services/messageService";
import { getAllUserMessages } from "@/services/shopService";
import { isLoggedIn } from "@/services/configService";
import { messageKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";
import { useAuthSession } from "@/hooks/use-auth-session";

export function useUnreadMessagesQuery() {
  const { isAuthenticated, isReady } = useAuthSession();
  const enabled = isReady && isAuthenticated;

  return useQuery({
    queryKey: messageKeys.unread(),
    queryFn: () => withTimeout(getUnreadCount()),
    enabled,
    staleTime: 15_000,
    refetchInterval: enabled ? 30_000 : false,
    retry: false,
  });
}

export function useConversationsQuery(enabled = true) {
  return useQuery({
    queryKey: messageKeys.conversations(),
    queryFn: () => withTimeout(getConversations()),
    enabled: enabled && typeof window !== "undefined" && isLoggedIn(),
    staleTime: 15_000,
  });
}

export function useInboxMessagesQuery() {
  return useQuery({
    queryKey: messageKeys.inbox(),
    queryFn: () => withTimeout(getAllUserMessages()),
    enabled: typeof window !== "undefined" && isLoggedIn(),
    staleTime: 20_000,
  });
}

export function useConversationQuery(partnerId: number | null) {
  return useQuery({
    queryKey: messageKeys.conversation(partnerId ?? 0),
    queryFn: () => withTimeout(getMessages(partnerId as number)),
    enabled: partnerId !== null && !Number.isNaN(partnerId),
    staleTime: 15_000,
  });
}

export function useHasConversationQuery(partnerId: number | null) {
  return useQuery({
    queryKey: [...messageKeys.conversation(partnerId ?? 0), "exists"] as const,
    queryFn: () => withTimeout(hasExistingConversation(partnerId as number)),
    enabled: partnerId !== null && !Number.isNaN(partnerId),
    staleTime: 30_000,
  });
}

export function useSearchMessagesQuery(query: string, enabled = true) {
  const term = query.trim();
  return useQuery({
    queryKey: messageKeys.search(term),
    queryFn: () => withTimeout(searchMessages(term)),
    enabled: enabled && term.length >= 2 && typeof window !== "undefined" && isLoggedIn(),
    staleTime: 10_000,
  });
}
