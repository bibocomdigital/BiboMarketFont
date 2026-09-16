"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthSession } from "@/hooks/use-auth-session";
import { messageKeys, notificationKeys } from "@/lib/query-keys";
import type { Notification } from "@/services/notificationService";
import { isChatMessageNotification } from "@/services/notificationService";
import {
  connectRealtimeSocket,
  disconnectRealtimeSocket,
  getRealtimeSocket,
} from "@infrastructure/realtime/socket-client";
import {
  incomingMessage,
  markMessagesRead,
  prependNotification,
  removeMessageFromCache,
  upsertIncomingMessage,
} from "@infrastructure/realtime/cache";

type RealtimeValue = {
  connected: boolean;
  isOnline: (userId?: number | null) => boolean;
  isTyping: (userId?: number | null) => boolean;
  notifyTyping: (receiverId: number) => void;
  notifyStopTyping: (receiverId: number) => void;
};

const RealtimeContext = createContext<RealtimeValue>({
  connected: false,
  isOnline: () => false,
  isTyping: () => false,
  notifyTyping: () => undefined,
  notifyStopTyping: () => undefined,
});

function asUserId(value: unknown): number | null {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { token, user, isAuthenticated } = useAuthSession();
  const [connected, setConnected] = useState(false);
  const [onlineIds, setOnlineIds] = useState<Set<number>>(() => new Set());
  const [typingIds, setTypingIds] = useState<Set<number>>(() => new Set());
  const typingTimers = useRef<Map<number, number>>(new Map());
  const lastTypingEmit = useRef(0);
  const meId = user?.id;

  const setTyping = useCallback((userId: number, typing: boolean) => {
    const existing = typingTimers.current.get(userId);
    if (existing) window.clearTimeout(existing);
    if (!typing) {
      typingTimers.current.delete(userId);
      setTypingIds((current) => {
        if (!current.has(userId)) return current;
        const next = new Set(current);
        next.delete(userId);
        return next;
      });
      return;
    }
    setTypingIds((current) => {
      if (current.has(userId)) return current;
      const next = new Set(current);
      next.add(userId);
      return next;
    });
    typingTimers.current.set(
      userId,
      window.setTimeout(() => {
        setTypingIds((current) => {
          if (!current.has(userId)) return current;
          const next = new Set(current);
          next.delete(userId);
          return next;
        });
        typingTimers.current.delete(userId);
      }, 4000)
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectRealtimeSocket();
      setConnected(false);
      setOnlineIds(new Set());
      setTypingIds(new Set());
      return;
    }

    const socket = connectRealtimeSocket(token);

    const onConnect = () => {
      setConnected(true);
      if (meId) {
        setOnlineIds((current) => new Set(current).add(meId));
      }
    };
    const onDisconnect = () => setConnected(false);

    const onOnlineUsers = (payload: { userIds?: number[] }) => {
      const ids = Array.isArray(payload?.userIds) ? payload.userIds.map(Number).filter(Boolean) : [];
      setOnlineIds(new Set(ids));
    };

    const onUserStatus = (payload: { userId?: number; status?: string }) => {
      const userId = asUserId(payload?.userId);
      if (!userId) return;
      setOnlineIds((current) => {
        const next = new Set(current);
        if (payload.status === "online") next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    const onUserTyping = (payload: { userId?: number; typing?: boolean }) => {
      const userId = asUserId(payload?.userId);
      if (!userId) return;
      setTyping(userId, !!payload.typing);
    };

    const onNewMessage = (payload: unknown) => {
      const message = incomingMessage(payload);
      if (!message) {
        void queryClient.invalidateQueries({ queryKey: messageKeys.all });
        return;
      }
      const meta =
        payload && typeof payload === "object" && "sender" in payload
          ? (payload as { sender?: { name?: string; photo?: string | null } }).sender
          : undefined;
      upsertIncomingMessage(queryClient, message, meId, meta);
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      void queryClient.invalidateQueries({ queryKey: messageKeys.unread() });
    };

    const onMessagesRead = (payload: { conversationPartnerId?: number }) => {
      const partnerId = asUserId(payload?.conversationPartnerId);
      if (partnerId) markMessagesRead(queryClient, partnerId, meId);
    };

    const onMessageRead = (payload: { messageId?: number; conversationPartnerId?: number }) => {
      const partnerId = asUserId(payload?.conversationPartnerId);
      const messageId = Number(payload?.messageId);
      if (partnerId) {
        markMessagesRead(queryClient, partnerId, meId, Number.isFinite(messageId) ? messageId : undefined);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: messageKeys.all });
    };

    const onMessageUpdated = () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.all });
    };

    const onMessageDeleted = (payload: { messageId?: number }) => {
      const messageId = Number(payload?.messageId);
      if (Number.isFinite(messageId)) removeMessageFromCache(queryClient, messageId);
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
    };

    const onNotification = (payload: Notification) => {
      if (isChatMessageNotification(payload)) {
        return;
      }
      if (!payload?.id) {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
        return;
      }
      prependNotification(queryClient, payload);
      toast(payload.message || "Nouvelle notification");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("online_users", onOnlineUsers);
    socket.on("user_status", onUserStatus);
    socket.on("user_typing", onUserTyping);
    socket.on("new_message", onNewMessage);
    socket.on("receive_message", onNewMessage);
    socket.on("message_sent", onNewMessage);
    socket.on("messages_read", onMessagesRead);
    socket.on("message_read", onMessageRead);
    socket.on("message_updated", onMessageUpdated);
    socket.on("message_deleted", onMessageDeleted);
    socket.on("new_notification", onNotification);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("online_users", onOnlineUsers);
      socket.off("user_status", onUserStatus);
      socket.off("user_typing", onUserTyping);
      socket.off("new_message", onNewMessage);
      socket.off("receive_message", onNewMessage);
      socket.off("message_sent", onNewMessage);
      socket.off("messages_read", onMessagesRead);
      socket.off("message_read", onMessageRead);
      socket.off("message_updated", onMessageUpdated);
      socket.off("message_deleted", onMessageDeleted);
      socket.off("new_notification", onNotification);
      disconnectRealtimeSocket();
      setConnected(false);
    };
  }, [isAuthenticated, token, meId, queryClient, setTyping]);

  const notifyTyping = useCallback((receiverId: number) => {
    const socket = getRealtimeSocket();
    if (!socket?.connected || !receiverId) return;
    const now = Date.now();
    if (now - lastTypingEmit.current < 400) return;
    lastTypingEmit.current = now;
    socket.emit("typing", { receiverId });
  }, []);

  const notifyStopTyping = useCallback((receiverId: number) => {
    const socket = getRealtimeSocket();
    if (!socket?.connected || !receiverId) return;
    lastTypingEmit.current = 0;
    socket.emit("stop_typing", { receiverId });
  }, []);

  const value = useMemo<RealtimeValue>(
    () => ({
      connected,
      isOnline: (userId) => !!userId && onlineIds.has(userId),
      isTyping: (userId) => !!userId && typingIds.has(userId),
      notifyTyping,
      notifyStopTyping,
    }),
    [connected, onlineIds, typingIds, notifyTyping, notifyStopTyping]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
