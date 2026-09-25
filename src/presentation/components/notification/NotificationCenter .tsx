"use client";

import React, { useState } from "react";
import { AlertCircle, Bell, CheckCheck, Trash2 } from "lucide-react";
import { useNotificationsQuery } from "@/hooks/queries/use-user-query";
import {
  useDeleteAllNotificationsMutation,
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/hooks/mutations/use-notification-mutations";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  isChatMessageNotification,
  type Notification,
} from "@/services/notificationService";
import { confirmAction } from "@/components/feedback/confirm-dialog";
import { NotificationsList } from "./NotificationsList";

const PREVIEW_LIMIT = 6;

const NotificationCenter = ({ tone = "default" }: { tone?: "default" | "admin" }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const deleteOne = useDeleteNotificationMutation();
  const deleteAll = useDeleteAllNotificationsMutation();
  const { data: notificationsData = [], isPending, isError, refetch } = useNotificationsQuery();

  const notifications = (Array.isArray(notificationsData) ? notificationsData : []).filter(
    (item) => !isChatMessageNotification(item),
  ) as Notification[];
  const preview = notifications.slice(0, PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, notifications.length - preview.length);
  const isLoading = isPending && notifications.length === 0;
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const admin = tone === "admin";

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      void markRead.mutateAsync(notification.id).catch(() => undefined);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleDeleteAll = async () => {
    const accepted = await confirmAction({
      title: "Supprimer toutes les notifications ?",
      description: "Cette action est définitive.",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      variant: "danger",
    });
    if (!accepted) return;
    await deleteAll.mutateAsync();
  };

  const openAll = () => {
    setIsOpen(false);
    navigate("/notifications");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative rounded-full p-2 focus:outline-none focus:ring-2",
            admin
              ? "hover:bg-white/10 focus:ring-[#7ee8d8]/40"
              : "hover:bg-slate-100 focus:ring-bibocom-accent/30",
          )}
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
              : "Notifications"
          }
        >
          <Bell
            size={20}
            className={
              unreadCount > 0
                ? admin
                  ? "text-[#7ee8d8]"
                  : "text-bibocom-primary"
                : admin
                  ? "text-white/70"
                  : "text-slate-500"
            }
          />
          {unreadCount > 0 ? (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-bibocom-accent px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="w-[min(22.5rem,calc(100vw-1.25rem))] overflow-hidden rounded-2xl border-slate-200 p-0 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-bibocom-primary">Notifications</p>
            <p className="text-xs text-slate-400">
              {unreadCount > 0
                ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                : "Tout est à jour"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => void markAllRead.mutateAsync()}
              disabled={unreadCount === 0}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-bibocom-primary disabled:opacity-30"
              aria-label="Tout marquer comme lu"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteAll()}
              disabled={notifications.length === 0}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
              aria-label="Tout supprimer"
              title="Tout supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-bibocom-accent border-t-transparent" />
              <p className="mt-3 text-sm text-slate-500">Chargement…</p>
            </div>
          ) : null}

          {isError ? (
            <div className="px-4 py-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
              <p className="mt-2 text-sm text-slate-600">Impossible de charger les notifications.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-3 text-sm font-semibold text-bibocom-accent hover:underline"
              >
                Réessayer
              </button>
            </div>
          ) : null}

          {!isLoading && !isError && notifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Bell className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-bibocom-primary">Aucune notification</p>
              <p className="mt-1 text-xs text-slate-400">Les nouvelles alertes apparaîtront ici.</p>
            </div>
          ) : null}

          {!isLoading && !isError && preview.length > 0 ? (
            <NotificationsList
              notifications={preview}
              onOpen={handleNotificationClick}
              onMarkRead={(id) => void markRead.mutateAsync(id)}
              onDelete={(id) => void deleteOne.mutateAsync(id)}
            />
          ) : null}
        </div>

        {!isLoading && !isError && notifications.length > 0 ? (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center">
            <button
              type="button"
              onClick={openAll}
              className="text-sm font-semibold text-bibocom-accent hover:underline"
            >
              {hiddenCount > 0
                ? `Voir toutes les notifications (${notifications.length})`
                : "Voir toutes les notifications"}
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
