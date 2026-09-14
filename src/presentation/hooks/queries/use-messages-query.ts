import { useQuery } from "@tanstack/react-query";
import { getMessages, hasExistingConversation } from "@/services/messageService";
import { getAllUserMessages } from "@/services/shopService";
import { isLoggedIn } from "@/services/configService";
import { messageKeys } from "@/lib/query-keys";
import { withTimeout } from "@infrastructure/api/with-timeout";

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
