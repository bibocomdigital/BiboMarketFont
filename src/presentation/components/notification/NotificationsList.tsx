"use client";

import React from "react";
import { CheckCheck, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/services/notificationService";
import {
  dateGroupLabel,
  formatNotificationMessage,
  notificationIcon,
  relativeTime,
} from "./notification-display";

type Props = {
  notifications: Notification[];
  onOpen: (notification: Notification) => void;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
};

export function NotificationsList({ notifications, onOpen, onMarkRead, onDelete }: Props) {
  const groups: { label: string; items: Notification[] }[] = [];
  const index = new Map<string, number>();
  notifications.forEach((item) => {
    const label = dateGroupLabel(item.createdAt);
    const existing = index.get(label);
    if (existing == null) {
      index.set(label, groups.length);
      groups.push({ label, items: [item] });
      return;
    }
    groups[existing].items.push(item);
  });

  return (
    <>
      {groups.map((group) => (
        <section key={group.label}>
          <p className="sticky top-0 z-10 bg-slate-50/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 backdrop-blur">
            {group.label}
          </p>
          <ul>
            {group.items.map((notification) => {
              const visual = notificationIcon(notification.type, notification.message);
              const Icon = visual.icon;
              return (
                <li key={notification.id}>
                  <div
                    role={notification.actionUrl ? "button" : undefined}
                    tabIndex={notification.actionUrl ? 0 : undefined}
                    onClick={() => onOpen(notification)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") onOpen(notification);
                    }}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors",
                      notification.actionUrl && "cursor-pointer hover:bg-slate-50",
                      !notification.isRead && "bg-orange-50/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl",
                        visual.className,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm leading-5 text-slate-700 [overflow-wrap:anywhere]",
                          !notification.isRead && "font-medium text-bibocom-primary",
                        )}
                      >
                        {formatNotificationMessage(notification.message)}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="truncate">{relativeTime(notification.createdAt)}</span>
                        {!notification.isRead ? (
                          <span className="ml-1 rounded-full bg-bibocom-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-bibocom-accent">
                            Nouveau
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {!notification.isRead ? (
                        <button
                          type="button"
                          className="rounded-full p-1.5 text-slate-300 hover:bg-white hover:text-emerald-500"
                          aria-label="Marquer comme lue"
                          title="Marquer comme lue"
                          onClick={(event) => {
                            event.stopPropagation();
                            onMarkRead(notification.id);
                          }}
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-full p-1.5 text-slate-300 hover:bg-white hover:text-red-500"
                        aria-label="Supprimer"
                        title="Supprimer"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(notification.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
