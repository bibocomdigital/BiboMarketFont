"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Filter,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  SquarePen,
  Video,
  X,
} from "lucide-react";
import { unwrapApi, unwrapList, unwrapRecord } from "@infrastructure/api/api-envelope";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useToast } from "@/hooks/use-toast";
import { useConversationsQuery, useConversationQuery, useSearchMessagesQuery } from "@/hooks/queries/use-messages-query";
import { useMerchantOrdersQuery } from "@/hooks/queries/use-orders-query";
import { useAdminUsersListQuery } from "@/hooks/queries/use-admin-query";
import { useSendMessageMutation } from "@/hooks/mutations/use-catalog-mutations";
import { useRealtime } from "@/hooks/use-realtime";
import { getPhotoUrl } from "@/services/authService";
import { markAllAsRead, type Conversation, type Message, type Partner } from "@/services/messageService";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { clearConversationUnread } from "@infrastructure/realtime/cache";

export type InboxVariant = "merchant" | "admin" | "client";

const THEME = {
  merchant: {
    root: "border-t border-slate-100 bg-white",
    aside: "border-slate-100 lg:border-r",
    title: "text-bibocom-primary",
    filter: "rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100",
    menu: "absolute right-8 top-9 z-10 w-32 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-100",
    menuItem: "block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50",
    icon: "rounded-full p-1.5 text-slate-500 hover:bg-slate-50",
    searchIcon: "text-slate-400",
    search:
      "w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-bibocom-primary outline-none placeholder:text-slate-400 focus:border-bibocom-secondary",
    muted: "text-slate-400",
    hover: "hover:bg-slate-50",
    active: "bg-[#eaf6ff]",
    name: "text-bibocom-primary",
    time: "text-slate-400",
    preview: "text-slate-500",
    unread: "bg-[#3b82f6] text-white",
    thread: "bg-[#f7fbff]",
    threadHeader: "border-b border-slate-100 bg-white",
    headerAction: "text-slate-400",
    headerActionBtn: "rounded-full p-2 hover:bg-slate-50",
    bubbleMine: "rounded-br-md bg-bibocom-primary text-white",
    bubbleOther: "rounded-bl-md bg-white text-slate-700",
    metaMine: "text-white/70",
    metaOther: "text-slate-400",
    composer: "border-t border-slate-100 bg-white",
    composerBar: "flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-100",
    composerBtn: "rounded-full p-2 text-slate-400 hover:bg-white",
    composerInput: "min-w-0 flex-1 bg-transparent py-2 text-sm text-bibocom-primary outline-none placeholder:text-slate-400",
    emoji: "absolute bottom-10 right-0 z-10 flex gap-1 rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-100",
    emojiItem: "h-8 w-8 rounded-lg hover:bg-slate-50",
    send: "flex h-10 w-10 items-center justify-center rounded-full bg-[#3b82f6] text-white hover:bg-[#2563eb] disabled:opacity-40",
    avatar: "bg-[#d8f4ea] font-semibold text-bibocom-primary",
    avatarRing: "border-white",
    typing: "text-[#2db37a]",
    online: "text-[#22c55e]",
    offline: "text-slate-400",
  },
  admin: {
    root: "border-t border-white/5 bg-[#16141f]",
    aside: "border-white/5 bg-[#12101a] lg:border-r",
    title: "text-white",
    filter: "rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10",
    menu: "absolute right-8 top-9 z-10 w-32 overflow-hidden rounded-xl bg-[#221e30] py-1 shadow-lg ring-1 ring-white/10",
    menuItem: "block w-full px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/5",
    icon: "rounded-full p-1.5 text-white/50 hover:bg-white/5",
    searchIcon: "text-white/30",
    search:
      "w-full rounded-full border border-white/10 bg-[#16141f] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#7ee8d8]/40",
    muted: "text-white/40",
    hover: "hover:bg-white/5",
    active: "bg-[#7ee8d8]/15",
    name: "text-white",
    time: "text-white/40",
    preview: "text-white/50",
    unread: "bg-[#7ee8d8] text-[#12101a]",
    thread: "bg-[#16141f]",
    threadHeader: "border-b border-white/5 bg-[#221e30]",
    headerAction: "text-white/40",
    headerActionBtn: "rounded-full p-2 hover:bg-white/5",
    bubbleMine: "rounded-br-md bg-[#7ee8d8] text-[#12101a]",
    bubbleOther: "rounded-bl-md bg-[#221e30] text-white/80",
    metaMine: "text-[#12101a]/60",
    metaOther: "text-white/40",
    composer: "border-t border-white/5 bg-[#221e30]",
    composerBar: "flex items-center gap-2 rounded-full bg-[#16141f] px-3 py-1.5 ring-1 ring-white/10",
    composerBtn: "rounded-full p-2 text-white/40 hover:bg-white/5",
    composerInput: "min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/30",
    emoji: "absolute bottom-10 right-0 z-10 flex gap-1 rounded-xl bg-[#221e30] p-2 shadow-lg ring-1 ring-white/10",
    emojiItem: "h-8 w-8 rounded-lg hover:bg-white/5",
    send: "flex h-10 w-10 items-center justify-center rounded-full bg-[#7ee8d8] text-[#12101a] hover:bg-[#6ad9c9] disabled:opacity-40",
    avatar: "bg-[#2a2438] font-semibold text-[#7ee8d8]",
    avatarRing: "border-[#12101a]",
    typing: "text-[#7ee8d8]",
    online: "text-emerald-300",
    offline: "text-white/40",
  },
  client: {
    root: "gap-4 bg-transparent lg:grid-cols-[300px_minmax(0,1fr)]",
    aside: "overflow-hidden rounded-[18px] bg-white shadow-[0_8px_30px_rgba(10,37,64,0.04)] ring-1 ring-slate-100",
    title: "text-bibocom-primary",
    filter: "rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100",
    menu: "absolute right-8 top-9 z-10 w-32 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-100",
    menuItem: "block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50",
    icon: "rounded-full p-1.5 text-slate-500 hover:bg-slate-50",
    searchIcon: "text-slate-400",
    search:
      "w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-bibocom-primary outline-none placeholder:text-slate-400 focus:border-bibocom-accent/40",
    muted: "text-slate-400",
    hover: "hover:bg-slate-50",
    active: "bg-[#e7f8ef]",
    name: "text-bibocom-primary",
    time: "text-slate-400",
    preview: "text-slate-500",
    unread: "bg-bibocom-error text-white",
    thread: "overflow-hidden rounded-[18px] bg-[#f7fbf9] shadow-[0_8px_30px_rgba(10,37,64,0.04)] ring-1 ring-slate-100",
    threadHeader: "border-b border-slate-100 bg-white",
    headerAction: "text-slate-400",
    headerActionBtn: "rounded-full p-2 hover:bg-slate-50",
    bubbleMine: "rounded-br-md bg-bibocom-success text-white",
    bubbleOther: "rounded-bl-md bg-white text-slate-700",
    metaMine: "text-white/70",
    metaOther: "text-slate-400",
    composer: "border-t border-slate-100 bg-white",
    composerBar: "flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-100",
    composerBtn: "rounded-full p-2 text-slate-400 hover:bg-white",
    composerInput: "min-w-0 flex-1 bg-transparent py-2 text-sm text-bibocom-primary outline-none placeholder:text-slate-400",
    emoji: "absolute bottom-10 right-0 z-10 flex gap-1 rounded-xl bg-white p-2 shadow-lg ring-1 ring-slate-100",
    emojiItem: "h-8 w-8 rounded-lg hover:bg-slate-50",
    send: "flex h-10 w-10 items-center justify-center rounded-full bg-bibocom-success text-white hover:bg-emerald-600 disabled:opacity-40",
    avatar: "bg-[#d8f4ea] font-semibold text-bibocom-primary",
    avatarRing: "border-white",
    typing: "text-bibocom-success",
    online: "text-bibocom-success",
    offline: "text-slate-400",
  },
} as const;

type InboxContact = {
  id: number;
  name: string;
  photo?: string | null;
  role: string;
};

const EMOJIS = ["😊", "👍", "🙏", "🔥", "❤️", "😂"];

function asConversations(raw: unknown): Conversation[] {
  return unwrapList(raw, ["data", "conversations"]) as Conversation[];
}

function asThread(raw: unknown): { partner: Partner | null; messages: Message[] } {
  const payload = unwrapApi(raw);
  const record = unwrapRecord(payload);
  const messages = Array.isArray(record.messages) ? (record.messages as Message[]) : [];
  const partner = (record.partner as Partner | undefined) || null;
  return { partner, messages };
}

function formatTime(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function initials(name?: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase() || "?";
}

function photoSrc(photo?: string | null) {
  const value = String(photo || "").trim();
  if (!value || value === "null" || value === "undefined") return "";
  if (value.includes("/api/placeholder")) return "";
  return getPhotoUrl(value);
}

function Avatar({
  name,
  photo,
  size = "md",
  status = false,
  tone = "merchant",
}: {
  name?: string;
  photo?: string | null;
  size?: "sm" | "md";
  status?: boolean;
  tone?: InboxVariant;
}) {
  const src = photoSrc(photo);
  const [failed, setFailed] = useState(!src);
  useEffect(() => {
    setFailed(!src);
  }, [src]);
  const dim = size === "sm" ? "h-9 w-9 text-sm" : "h-11 w-11 text-base";
  const ui = THEME[tone];
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full",
          ui.avatar,
          dim
        )}
      >
        {src && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          initials(name)
        )}
      </div>
      {status ? (
        <span className={cn("absolute bottom-0 left-0 h-3 w-3 rounded-full border-2 bg-[#22c55e]", ui.avatarRing)} />
      ) : null}
    </div>
  );
}

function roleKey(role?: string | null) {
  return String(role || "").toUpperCase();
}

function allowedRolesFor(variant: InboxVariant) {
  if (variant === "admin" || variant === "client") return ["MERCHANT"];
  return ["CLIENT", "ADMIN"];
}

function isAllowedPartner(role: string | null | undefined, variant: InboxVariant) {
  const allowed = allowedRolesFor(variant);
  const key = roleKey(role);
  if (!key) return true;
  return allowed.includes(key);
}

function roleBadgeClass(role?: string | null, variant: InboxVariant = "merchant") {
  const key = roleKey(role);
  if (variant === "admin") {
    if (key === "MERCHANT") return "text-[#7ee8d8]";
    if (key === "CLIENT") return "text-emerald-300";
    if (key === "ADMIN") return "text-[#7ee8d8]";
    return "text-white/40";
  }
  if (variant === "client") {
    if (key === "CLIENT") return "text-bibocom-success";
    if (key === "MERCHANT") return "text-bibocom-accent";
    if (key === "ADMIN") return "text-bibocom-accent";
    return "text-slate-400";
  }
  if (key === "CLIENT") return "text-[#2db37a]";
  if (key === "MERCHANT") return "text-[#0ea5e9]";
  if (key === "ADMIN") return "text-[#FF7E5F]";
  return "text-slate-400";
}

function roleBadgeLabel(role?: string | null) {
  const key = roleKey(role);
  if (key === "CLIENT") return "CLIENT";
  if (key === "MERCHANT") return "COMMERÇANT";
  if (key === "ADMIN") return "ADMIN";
  return key || "";
}

function conversationFromHit(message: Message, meId?: number): Conversation | null {
  const other =
    message.senderId === meId
      ? message.receiver
      : message.receiverId === meId
        ? message.sender
        : message.senderId === meId
          ? message.receiver
          : message.sender;
  const partnerId = other?.id || (message.senderId === meId ? message.receiverId : message.senderId);
  if (!partnerId) return null;
  const name = other
    ? `${other.firstName || ""} ${other.lastName || ""}`.trim()
    : "Conversation";
  return {
    partnerId,
    partnerName: name || "Conversation",
    partnerPhoto: other?.photo || null,
    partnerRole: String(other?.role || ""),
    lastMessage: message.content,
    lastMediaUrl: message.mediaUrl,
    lastMediaType: message.mediaType,
    lastMessageTime: message.createdAt,
    unreadCount: 0,
  };
}

function MessageMedia({ url, type }: { url: string; type?: string | null }) {
  const src = photoSrc(url);
  const [failed, setFailed] = useState(!src);
  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (!src || failed) {
    return <p className="mt-1 text-xs opacity-70">Média indisponible</p>;
  }
  if (type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="mt-2 max-h-48 rounded-lg object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <a href={src} className="mt-1 inline-block underline" target="_blank" rel="noreferrer">
      Pièce jointe
    </a>
  );
}

export function MerchantMessagesView({
  variant = "merchant",
  initialPartnerId = null,
}: {
  variant?: InboxVariant;
  initialPartnerId?: number | null;
} = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthSession();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(initialPartnerId);
  const [draft, setDraft] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [draftPartner, setDraftPartner] = useState<InboxContact | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const isAdminInbox = variant === "admin";
  const isClientInbox = variant === "client";

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (initialPartnerId) setSelectedId(initialPartnerId);
  }, [initialPartnerId]);

  const conversationsQuery = useConversationsQuery(true);
  const conversationQuery = useConversationQuery(selectedId);
  const searchQuery = useSearchMessagesQuery(debouncedSearch, !composeOpen && debouncedSearch.length >= 2);
  const ordersQuery = useMerchantOrdersQuery(!isAdminInbox && !isClientInbox);
  const merchantsQuery = useAdminUsersListQuery(
    { page: 1, limit: 50, role: "MERCHANT", search: composeOpen ? search.trim() || undefined : undefined },
    isAdminInbox && composeOpen
  );
  const sendMutation = useSendMessageMutation();
  const realtime = useRealtime();
  const { notifyStopTyping } = realtime;
  const ui = THEME[variant];

  const conversations = asConversations(conversationsQuery.data).filter((item) =>
    isAllowedPartner(item.partnerRole, variant)
  );
  const searchHits = unwrapList(searchQuery.data, ["data", "messages"]) as Message[];
  const thread = asThread(conversationQuery.data);
  const selected = conversations.find((item) => item.partnerId === selectedId) || null;
  const partnerName =
    thread.partner
      ? `${thread.partner.firstName || ""} ${thread.partner.lastName || ""}`.trim()
      : selected?.partnerName || draftPartner?.name || "";
  const partnerRole = selected?.partnerRole || thread.partner?.role || draftPartner?.role || "";

  const contacts = useMemo<InboxContact[]>(() => {
    if (isAdminInbox) {
      return (merchantsQuery.data?.users || []).map((item) => ({
        id: item.id,
        name: `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.email || `Commerçant #${item.id}`,
        photo: item.photo,
        role: "MERCHANT",
      }));
    }
    const map = new Map<number, InboxContact>();
    (ordersQuery.data || []).forEach((order) => {
      const id = Number(order.client?.id || order.clientId);
      if (!id) return;
      const name = `${order.client?.firstName || ""} ${order.client?.lastName || ""}`.trim() || `Client #${id}`;
      map.set(id, { id, name, role: "CLIENT" });
    });
    return Array.from(map.values());
  }, [isAdminInbox, merchantsQuery.data, ordersQuery.data]);

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((item) => !term || item.name.toLowerCase().includes(term));
  }, [contacts, search]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const byId = new Map<number, Conversation>();
    conversations.forEach((item) => {
      const matchesSearch =
        !term ||
        item.partnerName.toLowerCase().includes(term) ||
        String(item.lastMessage || "").toLowerCase().includes(term);
      const matchesFilter = filter === "all" || item.unreadCount > 0;
      if (matchesSearch && matchesFilter) byId.set(item.partnerId, item);
    });
    if (term.length >= 2) {
      searchHits.forEach((message) => {
        const hit = conversationFromHit(message, user?.id);
        if (!hit || !isAllowedPartner(hit.partnerRole, variant)) return;
        const existing = byId.get(hit.partnerId);
        if (!existing) byId.set(hit.partnerId, hit);
        else if (hit.lastMessage && existing.lastMessage !== hit.lastMessage) {
          byId.set(hit.partnerId, { ...existing, lastMessage: hit.lastMessage });
        }
      });
    }
    return Array.from(byId.values());
  }, [conversations, search, filter, searchHits, user?.id, variant]);

  useEffect(() => {
    if (selectedId !== null || conversations.length === 0 || composeOpen) return;
    setSelectedId(conversations[0].partnerId);
  }, [conversations, selectedId, composeOpen]);

  const lastIncomingId = useMemo(
    () => [...thread.messages].reverse().find((item) => item.senderId !== user?.id)?.id,
    [thread.messages, user?.id]
  );

  useEffect(() => {
    if (selectedId === null || !lastIncomingId) return;
    void markAllAsRead(selectedId)
      .then(() => clearConversationUnread(queryClient, selectedId))
      .catch(() => undefined);
  }, [selectedId, lastIncomingId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.messages.length, selectedId]);

  useEffect(() => {
    const partnerId = selectedId;
    return () => {
      if (partnerId) notifyStopTyping(partnerId);
    };
  }, [selectedId, notifyStopTyping]);

  const grouped = useMemo(() => {
    const groups: Array<{ label: string; items: Message[] }> = [];
    thread.messages.forEach((message) => {
      const label = dayLabel(message.createdAt);
      const last = groups[groups.length - 1];
      if (!last || last.label !== label) groups.push({ label, items: [message] });
      else last.items.push(message);
    });
    return groups;
  }, [thread.messages]);

  const handleSend = async () => {
    if (selectedId === null || (!draft.trim() && !media)) return;
    try {
      await sendMutation.mutateAsync({
        receiverId: selectedId,
        content: draft.trim(),
        media: media || undefined,
      });
      setDraft("");
      setMedia(null);
      setEmojiOpen(false);
      setDraftPartner(null);
      realtime.notifyStopTyping(selectedId);
    } catch (error) {
      toast({
        title: "Message non envoyé",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn("grid h-full min-h-0 flex-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]", ui.root)}>
      <aside
        className={cn(
          "flex h-full min-h-0 flex-col",
          ui.aside,
          selectedId !== null ? "hidden lg:flex" : "flex"
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4">
          <h2 className={cn("text-base font-semibold", ui.title)}>
            {composeOpen ? "Nouvelle discussion" : `Discussions (${conversations.length})`}
          </h2>
          <div className="relative flex items-center gap-1">
            {!composeOpen ? (
              <>
                <button
                  type="button"
                  onClick={() => setFilterOpen((open) => !open)}
                  className={cn("inline-flex items-center gap-1", ui.filter)}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {filter === "unread" ? "Non lus" : "Tout"}
                </button>
                {filterOpen ? (
                  <div className={ui.menu}>
                    <button
                      type="button"
                      className={ui.menuItem}
                      onClick={() => {
                        setFilter("all");
                        setFilterOpen(false);
                      }}
                    >
                      Tout
                    </button>
                    <button
                      type="button"
                      className={ui.menuItem}
                      onClick={() => {
                        setFilter("unread");
                        setFilterOpen(false);
                      }}
                    >
                      Non lus
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
            <button
              type="button"
              className={ui.icon}
              aria-label={composeOpen ? "Fermer" : "Nouvelle discussion"}
              onClick={() => {
                setComposeOpen((open) => !open);
                setFilterOpen(false);
                setSearch("");
              }}
            >
              {composeOpen ? <X className="h-4 w-4" /> : <SquarePen className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", ui.searchIcon)} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                composeOpen
                  ? isAdminInbox || isClientInbox
                    ? "Rechercher un commerçant..."
                    : "Rechercher un client..."
                  : isAdminInbox || isClientInbox
                    ? "Rechercher un commerçant ou un message..."
                    : "Rechercher un client ou un message..."
              }
              className={ui.search}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {composeOpen ? (
            (isAdminInbox ? merchantsQuery.isPending : ordersQuery.isPending) && filteredContacts.length === 0 ? (
              <p className={cn("px-4 py-10 text-center text-sm", ui.muted)}>Chargement des contacts…</p>
            ) : filteredContacts.length === 0 ? (
              <p className={cn("px-4 py-10 text-center text-sm", ui.muted)}>
                {isAdminInbox
                  ? "Aucun commerçant trouvé."
                  : isClientInbox
                    ? "Aucun commerçant trouvé. Ils apparaissent après une conversation."
                    : "Aucun client trouvé. Les clients apparaissent après une commande."}
              </p>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    setDraftPartner(contact);
                    setSelectedId(contact.id);
                    setComposeOpen(false);
                    setSearch("");
                  }}
                  className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors", ui.hover)}
                >
                  <Avatar name={contact.name} photo={contact.photo} tone={variant} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-semibold", ui.name)}>
                      {contact.name}
                      <span className={cn("ml-1 align-middle text-[10px] font-bold uppercase tracking-wide", roleBadgeClass(contact.role, variant))}>
                        {roleBadgeLabel(contact.role)}
                      </span>
                    </p>
                    <p className={cn("truncate text-xs", ui.preview)}>Démarrer une conversation</p>
                  </div>
                </button>
              ))
            )
          ) : conversationsQuery.isPending && conversations.length === 0 ? (
            <p className={cn("px-4 py-10 text-center text-sm", ui.muted)}>Chargement des discussions…</p>
          ) : filtered.length === 0 ? (
            <p className={cn("px-4 py-10 text-center text-sm", ui.muted)}>
              {search.trim()
                ? "Aucun résultat."
                : isAdminInbox
                  ? "Aucune discussion avec les commerçants."
                  : isClientInbox
                    ? "Aucune discussion pour le moment."
                    : "Aucune discussion avec vos clients."}
            </p>
          ) : (
            filtered.map((chat) => {
              const active = chat.partnerId === selectedId;
              return (
                <button
                  key={chat.partnerId}
                  type="button"
                  onClick={() => {
                    setDraftPartner(null);
                    setSelectedId(chat.partnerId);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                    active ? ui.active : ui.hover
                  )}
                >
                  <Avatar name={chat.partnerName} photo={chat.partnerPhoto} status={realtime.isOnline(chat.partnerId)} tone={variant} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm font-semibold", ui.name)}>
                        {chat.partnerName}
                        {chat.partnerRole ? (
                          <span className={cn("ml-1 align-middle text-[10px] font-bold uppercase tracking-wide", roleBadgeClass(chat.partnerRole, variant))}>
                            {roleBadgeLabel(chat.partnerRole)}
                          </span>
                        ) : null}
                      </p>
                      <span className={cn("shrink-0 text-[11px]", ui.time)}>{formatTime(chat.lastMessageTime)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={cn("truncate text-xs", ui.preview)}>
                        {chat.lastMediaType ? "Pièce jointe" : chat.lastMessage || "—"}
                      </p>
                      {chat.unreadCount > 0 ? (
                        <span className={cn("flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold", ui.unread)}>
                          {chat.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className={cn("flex h-full min-h-0 flex-col", ui.thread, selectedId === null ? "hidden lg:flex" : "flex")}>
        {selectedId === null ? (
          <div className={cn("flex flex-1 items-center justify-center text-sm", ui.muted)}>
            Sélectionnez une discussion.
          </div>
        ) : (
          <>
            <header className={cn("flex items-center justify-between gap-3 px-4 py-3", ui.threadHeader)}>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={cn(
                    "text-sm",
                    isClientInbox
                      ? "inline-flex items-center gap-1 rounded-full bg-bibocom-accent/10 px-3 py-1.5 font-medium text-bibocom-accent hover:bg-bibocom-accent/20"
                      : cn("lg:hidden", ui.preview)
                  )}
                  onClick={() => setSelectedId(null)}
                >
                  ← Retour
                </button>
                <Avatar name={partnerName} photo={thread.partner?.photo || selected?.partnerPhoto} status={realtime.isOnline(selectedId)} tone={variant} />
                <div>
                  <p className={cn("font-semibold", ui.name)}>{partnerName || "Conversation"}</p>
                  <p
                    className={cn(
                      "text-xs font-medium",
                      realtime.isTyping(selectedId)
                        ? ui.typing
                        : realtime.isOnline(selectedId)
                          ? ui.online
                          : ui.offline
                    )}
                  >
                    {realtime.isTyping(selectedId)
                      ? "En train d'écrire…"
                      : realtime.isOnline(selectedId)
                        ? "En ligne"
                        : "Hors ligne"}
                    {partnerRole ? (
                      <span className={cn("ml-2 uppercase tracking-wide", roleBadgeClass(partnerRole, variant))}>
                        {roleBadgeLabel(partnerRole)}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className={cn("flex items-center gap-1", ui.headerAction)}>
                <IconButton label="Appel" className={ui.headerActionBtn}>
                  <Phone className="h-4 w-4" />
                </IconButton>
                <IconButton label="Vidéo" className={ui.headerActionBtn}>
                  <Video className="h-4 w-4" />
                </IconButton>
                <IconButton label="Plus" className={ui.headerActionBtn}>
                  <MoreVertical className="h-4 w-4" />
                </IconButton>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {conversationQuery.isPending && thread.messages.length === 0 ? (
                <p className={cn("py-10 text-center text-sm", ui.muted)}>Chargement des messages…</p>
              ) : thread.messages.length === 0 ? (
                <p className={cn("py-10 text-center text-sm", ui.muted)}>Aucun message pour le moment. Envoyez le premier message.</p>
              ) : (
                grouped.map((group) => (
                  <div key={group.label} className="mb-5">
                    <p className={cn("mb-4 text-center text-[11px]", ui.muted)}>{group.label}</p>
                    <div className="space-y-3">
                      {group.items.map((message) => {
                        const mine = message.senderId === user?.id;
                        return (
                          <div key={message.id} className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}>
                            {!mine ? (
                              <Avatar
                                name={partnerName}
                                photo={thread.partner?.photo || selected?.partnerPhoto}
                                size="sm"
                                status={realtime.isOnline(selectedId)}
                                tone={variant}
                              />
                            ) : null}
                            <div
                              className={cn(
                                "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                                mine ? ui.bubbleMine : ui.bubbleOther
                              )}
                            >
                              {message.content ? <p>{message.content}</p> : null}
                              {message.mediaUrl ? (
                                <MessageMedia url={message.mediaUrl} type={message.mediaType} />
                              ) : null}
                              <div
                                className={cn(
                                  "mt-1 flex items-center justify-end gap-1 text-[10px]",
                                  mine ? ui.metaMine : ui.metaOther
                                )}
                              >
                                {formatTime(message.createdAt)}
                                {mine ? message.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" /> : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form
              className={cn("shrink-0 px-4 py-3", ui.composer)}
              onSubmit={(event) => {
                event.preventDefault();
                void handleSend();
              }}
            >
              {media ? (
                <p className={cn("mb-2 truncate text-xs", ui.preview)}>Fichier : {media.name}</p>
              ) : null}
              <div className={ui.composerBar}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(event) => setMedia(event.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  className={ui.composerBtn}
                  onClick={() => fileRef.current?.click()}
                  aria-label="Joindre un fichier"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (selectedId) realtime.notifyTyping(selectedId);
                  }}
                  onBlur={() => {
                    if (selectedId) realtime.notifyStopTyping(selectedId);
                  }}
                  placeholder="Votre message..."
                  className={ui.composerInput}
                />
                <div className="relative">
                  <button
                    type="button"
                    className={ui.composerBtn}
                    onClick={() => setEmojiOpen((open) => !open)}
                    aria-label="Emojis"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                  {emojiOpen ? (
                    <div className={ui.emoji}>
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={ui.emojiItem}
                          onClick={() => {
                            setDraft((current) => `${current}${emoji}`);
                            setEmojiOpen(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="submit"
                  disabled={sendMutation.isPending || (!draft.trim() && !media)}
                  className={ui.send}
                  aria-label="Envoyer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function IconButton({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <button type="button" className={className || "rounded-full p-2 hover:bg-slate-50"} aria-label={label}>
      {children}
    </button>
  );
}
