"use client";

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCheck, Trash2 } from "lucide-react";
import { useAuthSession, dashboardPathFor } from "@/hooks/use-auth-session";
import { useNotificationsQuery } from "@/hooks/queries/use-user-query";
import {
  useDeleteAllNotificationsMutation,
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/hooks/mutations/use-notification-mutations";
import { isChatMessageNotification, type Notification } from "@/services/notificationService";
import { NotificationsList } from "@/components/notification/NotificationsList";
import { confirmAction } from "@/components/feedback/confirm-dialog";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isReady } = useAuthSession();
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const deleteOne = useDeleteNotificationMutation();
  const deleteAll = useDeleteAllNotificationsMutation();
  const { data = [], isPending, isError, refetch } = useNotificationsQuery();

  const notifications = (Array.isArray(data) ? data : []).filter(
    (item) => !isChatMessageNotification(item),
  ) as Notification[];
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const loading = isPending && notifications.length === 0;

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isReady, isAuthenticated, navigate]);

  const openNotification = (notification: Notification) => {
    if (!notification.isRead) {
      void markRead.mutateAsync(notification.id).catch(() => undefined);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
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

  if (!isReady || !isAuthenticated) {
    return <div className="min-h-screen bg-[#f6f8fb]" />;
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate(dashboardPathFor(user?.role))}
              className="mb-2 inline-flex items-center gap-1 rounded-full bg-bibocom-accent/10 px-3 py-1.5 text-sm font-medium text-bibocom-accent hover:bg-bibocom-accent/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </button>
            <h1 className="text-xl font-semibold text-bibocom-primary">Notifications</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""} · ${notifications.length} au total`
                : `${notifications.length} notification${notifications.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => void markAllRead.mutateAsync()}
              disabled={unreadCount === 0}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-bibocom-primary disabled:opacity-30"
              aria-label="Tout marquer comme lu"
              title="Tout marquer comme lu"
            >
              <CheckCheck className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteAll()}
              disabled={notifications.length === 0}
              className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
              aria-label="Tout supprimer"
              title="Tout supprimer"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {loading ? (
            <div className="px-4 py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-bibocom-accent border-t-transparent" />
              <p className="mt-3 text-sm text-slate-500">Chargement…</p>
            </div>
          ) : null}

          {isError ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-slate-600">Impossible de charger les notifications.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-3 text-sm font-semibold text-bibocom-accent hover:underline"
              >
                Réessayer
              </button>
            </div>
          ) : null}

          {!loading && !isError && notifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                <Bell className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-bibocom-primary">Aucune notification</p>
              <p className="mt-1 text-xs text-slate-400">Les nouvelles alertes apparaîtront ici.</p>
            </div>
          ) : null}

          {!loading && !isError && notifications.length > 0 ? (
            <NotificationsList
              notifications={notifications}
              onOpen={openNotification}
              onMarkRead={(id) => void markRead.mutateAsync(id)}
              onDelete={(id) => void deleteOne.mutateAsync(id)}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
