import type { QueryClient } from "@tanstack/react-query";
import { unwrapList, unwrapRecord } from "@infrastructure/api/api-envelope";
import { messageKeys, notificationKeys } from "@/lib/query-keys";
import type { Conversation, Message } from "@/services/messageService";
import type { Notification } from "@/services/notificationService";

export function incomingMessage(payload: unknown): Message | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const nested = record.message;
  if (nested && typeof nested === "object" && "id" in nested) {
    return nested as Message;
  }
  if (typeof record.id === "number" && record.senderId != null && record.receiverId != null) {
    return record as unknown as Message;
  }
  return null;
}

function partnerIdOf(message: Message, meId?: number) {
  return message.senderId === meId ? message.receiverId : message.senderId;
}

function withConversations(old: unknown, next: Conversation[]) {
  if (old && typeof old === "object" && "data" in old) {
    return { ...(old as Record<string, unknown>), success: true, data: next };
  }
  return { success: true, data: next };
}

function withThread(old: unknown, messages: Message[], extra?: Record<string, unknown>) {
  const record = unwrapRecord(old);
  const partner = extra?.partner ?? record.partner;
  if (old && typeof old === "object" && "data" in old) {
    return {
      ...(old as Record<string, unknown>),
      success: true,
      data: { ...record, partner, messages },
    };
  }
  return { partner, messages };
}

export function upsertIncomingMessage(
  queryClient: QueryClient,
  message: Message,
  meId?: number,
  senderMeta?: { name?: string; photo?: string | null }
) {
  const partnerId = partnerIdOf(message, meId);
  const threadOld = queryClient.getQueryData(messageKeys.conversation(partnerId));
  const threadMessages = threadOld
    ? ((Array.isArray(unwrapRecord(threadOld).messages) ? unwrapRecord(threadOld).messages : []) as Message[])
    : [];
  const alreadySeen = threadMessages.some((item) => item.id === message.id);
  const unreadBump = !alreadySeen && message.senderId !== meId ? 1 : 0;
  if (unreadBump) bumpUnreadCount(queryClient, unreadBump);

  queryClient.setQueryData(messageKeys.conversations(), (old: unknown) => {
    if (!old) return old;
    const list = unwrapList(old, ["data", "conversations"]) as Conversation[];
    const existing = list.find((item) => item.partnerId === partnerId);
    const sender = message.sender;
    const fallbackName = sender
      ? `${sender.firstName || ""} ${sender.lastName || ""}`.trim()
      : "";
    const nextItem: Conversation = {
      partnerId,
      partnerName: existing?.partnerName || senderMeta?.name || fallbackName || "Conversation",
      partnerPhoto: existing?.partnerPhoto || senderMeta?.photo || sender?.photo || null,
      partnerRole: existing?.partnerRole || "",
      lastMessage: message.content,
      lastMediaUrl: message.mediaUrl,
      lastMediaType: message.mediaType,
      lastMessageTime: message.createdAt,
      unreadCount: (existing?.unreadCount || 0) + unreadBump,
    };
    return withConversations(
      old,
      [nextItem, ...list.filter((item) => item.partnerId !== partnerId)]
    );
  });

  queryClient.setQueryData(messageKeys.conversation(partnerId), (old: unknown) => {
    if (!old) return old;
    const record = unwrapRecord(old);
    const messages = (Array.isArray(record.messages) ? record.messages : []) as Message[];
    if (messages.some((item) => item.id === message.id)) return old;
    return withThread(old, [...messages, message]);
  });
}

export function markMessagesRead(
  queryClient: QueryClient,
  partnerId: number,
  meId?: number,
  messageId?: number
) {
  queryClient.setQueryData(messageKeys.conversation(partnerId), (old: unknown) => {
    if (!old) return old;
    const record = unwrapRecord(old);
    const messages = (Array.isArray(record.messages) ? record.messages : []) as Message[];
    const next = messages.map((item) => {
      if (messageId && item.id !== messageId) return item;
      if (item.senderId !== meId) return item;
      return { ...item, isRead: true };
    });
    return withThread(old, next);
  });
}

export function removeMessageFromCache(queryClient: QueryClient, messageId: number) {
  const matches = queryClient.getQueriesData({ queryKey: messageKeys.all });
  matches.forEach(([key, old]) => {
    if (!old || !Array.isArray(key) || key[1] !== "conversation") return;
    const record = unwrapRecord(old);
    const messages = (Array.isArray(record.messages) ? record.messages : []) as Message[];
    if (!messages.some((item) => item.id === messageId)) return;
    queryClient.setQueryData(key, withThread(old, messages.filter((item) => item.id !== messageId)));
  });
}

export function prependNotification(queryClient: QueryClient, notification: Notification) {
  queryClient.setQueryData(notificationKeys.list(), (old: unknown) => {
    const list = Array.isArray(old) ? (old as Notification[]) : unwrapList(old, ["notifications"]) as Notification[];
    if (list.some((item) => item.id === notification.id)) return old ?? list;
    return [notification, ...list];
  });
}

export function bumpUnreadCount(queryClient: QueryClient, delta: number) {
  const key = messageKeys.unread();
  const current = queryClient.getQueryData<number>(key);
  if (typeof current === "number") {
    queryClient.setQueryData(key, Math.max(0, current + delta));
    return;
  }
  void queryClient.invalidateQueries({ queryKey: key });
}

export function clearConversationUnread(queryClient: QueryClient, partnerId: number) {
  queryClient.setQueryData(messageKeys.conversations(), (old: unknown) => {
    if (!old) return old;
    const list = unwrapList(old, ["data", "conversations"]) as Conversation[];
    const cleared = list.find((item) => item.partnerId === partnerId)?.unreadCount || 0;
    if (cleared > 0) bumpUnreadCount(queryClient, -cleared);
    return withConversations(
      old,
      list.map((item) => (item.partnerId === partnerId ? { ...item, unreadCount: 0 } : item))
    );
  });
}
