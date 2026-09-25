"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getErrorStatus } from "@domain/errors/app-error";
import { useAuthSession, dashboardPathFor, hasStoredCredentials } from "@/hooks/use-auth-session";
import { useAdminDashboardQuery } from "@/hooks/queries/use-admin-query";
import { AdminShell, type AdminAudience, type AdminSection } from "./admin/AdminShell";
import { AdminOverview } from "./admin/AdminOverview";
import { AdminUsersView } from "./admin/AdminUsersView";
import { AdminShopsView } from "./admin/AdminShopsView";
import { AdminProductsView } from "./admin/AdminProductsView";
import { AdminOrderDialog, AdminOrdersView } from "./admin/AdminOrdersView";
import { AdminFeedbacksView } from "./admin/AdminFeedbacksView";
import { AdminCategoriesView } from "./admin/AdminCategoriesView";
import { AdminStoriesView } from "./admin/AdminStoriesView";
import { AdminBadgeSettingsView } from "./admin/AdminBadgeSettingsView";
import {
  AdminAdsView,
  AdminFinanceView,
  AdminReportsView,
  AdminSecurityView,
  AdminTicketsView,
} from "./admin/AdminOpsViews";
import { AdminMessagesView } from "./admin/AdminMessagesView";
import NotificationCenter from "@/components/notification/NotificationCenter ";

const SECTIONS: AdminSection[] = [
  "dashboard",
  "users",
  "shops",
  "products",
  "orders",
  "messages",
  "feedbacks",
  "categories",
  "stories",
  "reports",
  "ads",
  "tickets",
  "finance",
  "security",
  "badge",
];

const MODERATOR_SECTIONS = new Set<AdminSection>(["shops", "products", "stories", "reports", "messages", "security"]);

const SIDEBAR_KEY = "bibo.admin.sidebarCollapsed";

function isAdminSection(value: string | null): value is AdminSection {
  return !!value && SECTIONS.includes(value as AdminSection);
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, isReady, logout } = useAuthSession();
  const role = (user?.role || "").toUpperCase();
  const audience: AdminAudience =
    role === "SUPER_ADMIN" ? "super" : role === "MODERATOR" ? "moderator" : "admin";
  const isStaff = role === "ADMIN" || role === "SUPER_ADMIN" || role === "MODERATOR";
  const enabled = isReady && isAuthenticated && isStaff;

  const viewParam = searchParams.get("view");
  const requested: AdminSection = isAdminSection(viewParam) ? viewParam : "dashboard";
  const section: AdminSection =
    audience === "moderator" && !MODERATOR_SECTIONS.has(requested)
      ? "products"
      : audience !== "super" && (requested === "badge" || requested === "finance")
        ? "dashboard"
        : requested;
  const orderParam = Number(searchParams.get("order") || 0);
  const selectedOrderId = Number.isFinite(orderParam) && orderParam > 0 ? orderParam : null;
  const partnerParam = Number(searchParams.get("partner") || 0);
  const selectedPartnerId = Number.isFinite(partnerParam) && partnerParam > 0 ? partnerParam : null;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [months, setMonths] = useState(12);

  const dashboardQuery = useAdminDashboardQuery(months, enabled && section === "dashboard");

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      setCollapsed(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      if (hasStoredCredentials()) return;
      navigate("/login", { replace: true });
      return;
    }
    if (!isStaff) {
      navigate(dashboardPathFor(user?.role), { replace: true });
    }
  }, [isReady, isAuthenticated, isStaff, navigate, user?.role]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (dashboardQuery.fetchStatus === "fetching") return;
    if (!dashboardQuery.isFetched) return;
    if (getErrorStatus(dashboardQuery.error) === 401) {
      logout();
      navigate("/login", { replace: true });
    }
  }, [dashboardQuery.error, dashboardQuery.fetchStatus, dashboardQuery.isFetched, isAuthenticated, logout, navigate]);

  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  const handleSectionChange = (next: AdminSection) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next === "dashboard") params.delete("view");
      else params.set("view", next);
      if (next !== "orders") params.delete("order");
      if (next !== "messages") params.delete("partner");
      return params;
    });
  };

  const handleMessageMerchant = (id: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("view", "messages");
      params.set("partner", String(id));
      params.delete("order");
      return params;
    });
  };

  const handleSelectOrder = (id: number | null) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (id) {
        params.set("view", section === "dashboard" ? "orders" : section);
        params.set("order", String(id));
      } else {
        params.delete("order");
      }
      return params;
    });
  };

  const handleToggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (!isReady || !isAuthenticated || !isStaff) {
    return <div className="min-h-screen bg-[#16141f]" />;
  }

  return (
    <AdminShell
      section={section}
      onSectionChange={handleSectionChange}
      collapsed={collapsed}
      onToggleCollapsed={handleToggleCollapsed}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
      displayName={displayName}
      audience={audience}
      onLogout={handleLogout}
      headerExtra={<NotificationCenter tone="admin" />}
    >
      {section === "dashboard" && (
        <>
          <AdminOverview
            data={dashboardQuery.data}
            loading={dashboardQuery.isPending}
            error={dashboardQuery.error}
            months={months}
            onMonthsChange={setMonths}
            onOpenOrder={(id) => {
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                params.set("order", String(id));
                return params;
              });
            }}
          />
          <AdminOrderDialog orderId={selectedOrderId} onClose={() => handleSelectOrder(null)} />
        </>
      )}
      {section === "users" && (
        <AdminUsersView
          enabled={enabled}
          canAssignStaff={audience === "super"}
          onMessageMerchant={handleMessageMerchant}
        />
      )}
      {section === "shops" && <AdminShopsView enabled={enabled} canManageBadge={audience !== "moderator"} />}
      {section === "products" && <AdminProductsView enabled={enabled} />}
      {section === "orders" && (
        <AdminOrdersView
          enabled={enabled}
          selectedOrderId={selectedOrderId}
          onSelectOrder={handleSelectOrder}
        />
      )}
      {section === "messages" && <AdminMessagesView initialPartnerId={selectedPartnerId} />}
      {section === "feedbacks" && <AdminFeedbacksView enabled={enabled} />}
      {section === "categories" && <AdminCategoriesView enabled={enabled} />}
      {section === "stories" && <AdminStoriesView enabled={enabled} />}
      {section === "reports" && <AdminReportsView enabled={enabled} />}
      {section === "ads" && <AdminAdsView enabled={enabled} />}
      {section === "tickets" && <AdminTicketsView enabled={enabled} />}
      {section === "finance" && <AdminFinanceView enabled={enabled && audience === "super"} />}
      {section === "security" && <AdminSecurityView />}
      {section === "badge" && <AdminBadgeSettingsView enabled={enabled && audience === "super"} />}
    </AdminShell>
  );
};

export default AdminDashboard;
