"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getErrorStatus } from "@domain/errors/app-error";
import { useAuthSession, dashboardPathFor } from "@/hooks/use-auth-session";
import { useOrdersQuery } from "@/hooks/queries/use-orders-query";
import NotificationCenter from "@/components/notification/NotificationCenter ";
import CartIcon from "@/components/CartIcon";
import ProductsGrid from "@/components/ProductsGrid";
import Shops from "@/components/Shops";
import AboutPage from "@/presentation/pages/AboutPage";
import ContactPage from "@/presentation/pages/ContactPage";
import { ClientShell, clientRoleLabel, type ClientSection } from "./client/ClientShell";
import { ClientOverview } from "./client/ClientOverview";
import { ClientOrdersView } from "./client/ClientOrdersView";
import { ClientCategoriesView } from "./client/ClientCategoriesView";
import { ClientMessagesView } from "./client/ClientMessagesView";

const SECTIONS: ClientSection[] = [
  "dashboard",
  "categories",
  "products",
  "orders",
  "messages",
  "boutiques",
  "about",
  "contact",
];

function isClientSection(value: string | null): value is ClientSection {
  return !!value && SECTIONS.includes(value as ClientSection);
}

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, isReady, logout } = useAuthSession();
  const isClient = (user?.role || "").toUpperCase() === "CLIENT";

  const viewParam = searchParams.get("view");
  const section: ClientSection = isClientSection(viewParam) ? viewParam : "dashboard";
  const partnerParam = Number(searchParams.get("partner") || 0);
  const selectedPartnerId = Number.isFinite(partnerParam) && partnerParam > 0 ? partnerParam : null;

  const [mobileOpen, setMobileOpen] = useState(false);
  const ordersQuery = useOrdersQuery();
  const orders = Array.isArray(ordersQuery.data) ? ordersQuery.data : [];

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isClient) {
      navigate(dashboardPathFor(user?.role), { replace: true });
    }
  }, [isReady, isAuthenticated, isClient, navigate, user?.role]);

  useEffect(() => {
    if (getErrorStatus(ordersQuery.error) === 401) {
      logout();
      navigate("/login", { replace: true });
    }
  }, [ordersQuery.error, logout, navigate]);

  const handleSectionChange = (next: ClientSection) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next === "dashboard") params.delete("view");
      else params.set("view", next);
      if (next !== "messages") params.delete("partner");
      if (next !== "products") params.delete("q");
      if (next !== "products") params.delete("category");
      if (next !== "boutiques") params.delete("categorieShopId");
      return params;
    });
  };

  const handleSearch = (query: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("view", "products");
      if (query) params.set("q", query);
      else params.delete("q");
      return params;
    });
  };

  if (!isReady || !isAuthenticated || !isClient) {
    return <div className="min-h-screen bg-[#f6f8fb]" />;
  }

  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  return (
    <ClientShell
      section={section}
      onSectionChange={handleSectionChange}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
      displayName={displayName}
      roleLabel={clientRoleLabel(user?.role)}
      photo={user?.photo}
      onSearch={handleSearch}
      onPremiumClick={() => handleSectionChange("products")}
      onProfileClick={() => navigate("/profile")}
      headerExtra={
        <div className="flex items-center gap-1">
          <NotificationCenter />
          <CartIcon onClick={() => navigate("/cart")} />
        </div>
      }
    >
      {section === "dashboard" && (
        <ClientOverview
          orders={orders}
          loading={ordersQuery.isPending && orders.length === 0}
          onOpenOrders={() => handleSectionChange("orders")}
          onOpenProducts={() => handleSectionChange("products")}
          onOpenProfile={() => navigate("/profile")}
        />
      )}
      {section === "categories" && (
        <ClientCategoriesView
          onOpenProducts={(categoryId) => {
            setSearchParams((prev) => {
              const params = new URLSearchParams(prev);
              params.set("view", "products");
              if (categoryId) params.set("category", String(categoryId));
              return params;
            });
          }}
          onOpenBoutiques={(categoryId) => {
            setSearchParams((prev) => {
              const params = new URLSearchParams(prev);
              params.set("view", "boutiques");
              if (categoryId) params.set("categorieShopId", String(categoryId));
              return params;
            });
          }}
        />
      )}
      {section === "products" && <ProductsGrid />}
      {section === "orders" && <ClientOrdersView />}
      {section === "messages" && <ClientMessagesView initialPartnerId={selectedPartnerId} />}
      {section === "boutiques" && <Shops />}
      {section === "about" && <AboutPage embedded />}
      {section === "contact" && <ContactPage embedded />}
    </ClientShell>
  );
};

export default ClientDashboard;
