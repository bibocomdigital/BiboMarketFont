"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User } from "lucide-react";
import { getErrorStatus } from "@domain/errors/app-error";
import { useAuthSession, dashboardPathFor } from "@/hooks/use-auth-session";
import { useMyShopQuery } from "@/hooks/queries/use-shops-query";
import {
  useMerchantProductStatsQuery,
  useMerchantRevenueChartQuery,
  useMerchantStatsQuery,
} from "@/hooks/queries/use-merchant-query";
import NotificationCenter from "@/components/notification/NotificationCenter ";
import { MerchantShell, type MerchantSection } from "./merchant/MerchantShell";
import { MerchantOverview } from "./merchant/MerchantOverview";
import { MerchantShopView } from "./merchant/MerchantShopView";
import { MerchantProductsView } from "./merchant/MerchantProductsView";
import { MerchantOrdersView } from "./merchant/MerchantOrdersView";
import { MerchantMessagesView } from "./merchant/MerchantMessagesView";
import { MerchantProfileView } from "./merchant/MerchantProfileView";
import { isShopMissingError, Panel, queryErrorMessage } from "./merchant/ui";

const SECTIONS: MerchantSection[] = ["dashboard", "boutique", "products", "orders", "messages", "profile"];
const SIDEBAR_KEY = "bibo.merchant.sidebarCollapsed";

function isMerchantSection(value: string | null): value is MerchantSection {
  return !!value && SECTIONS.includes(value as MerchantSection);
}

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, isReady, logout } = useAuthSession();
  const isMerchant =
    (user?.role || "").toUpperCase() === "MERCHANT" ||
    (user?.role || "").toUpperCase() === "COMMERCANT";
  const enabled = isReady && isAuthenticated && isMerchant;

  const viewParam = searchParams.get("view");
  const section: MerchantSection = isMerchantSection(viewParam) ? viewParam : "dashboard";
  const orderParam = Number(searchParams.get("order") || 0);
  const selectedOrderId = Number.isFinite(orderParam) && orderParam > 0 ? orderParam : null;
  const partnerParam = Number(searchParams.get("partner") || 0);
  const selectedPartnerId = Number.isFinite(partnerParam) && partnerParam > 0 ? partnerParam : null;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [days, setDays] = useState(7);

  const shopQuery = useMyShopQuery(enabled);
  const shopMissing = isShopMissingError(shopQuery.error);
  const hasShop = Boolean(shopQuery.data?.id) && !shopMissing;
  const statsEnabled = enabled && hasShop && section === "dashboard";
  const statsQuery = useMerchantStatsQuery(statsEnabled);
  const chartQuery = useMerchantRevenueChartQuery(days, statsEnabled);
  const productStatsQuery = useMerchantProductStatsQuery(statsEnabled);

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
      navigate("/login", { replace: true });
      return;
    }
    if (!isMerchant) {
      navigate(dashboardPathFor(user?.role), { replace: true });
    }
  }, [isReady, isAuthenticated, isMerchant, navigate, user?.role]);

  useEffect(() => {
    const errors = [statsQuery.error, chartQuery.error, productStatsQuery.error, shopQuery.error];
    if (errors.some((error) => getErrorStatus(error) === 401)) {
      logout();
      navigate("/login", { replace: true });
    }
  }, [statsQuery.error, chartQuery.error, productStatsQuery.error, shopQuery.error, logout, navigate]);

  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  const handleSectionChange = (next: MerchantSection) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next === "dashboard") params.delete("view");
      else params.set("view", next);
      if (next !== "orders" && next !== "dashboard") params.delete("order");
      if (next !== "messages") params.delete("partner");
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
    navigate("/login");
  };

  const refreshShop = () => {
    void shopQuery.refetch();
  };

  if (!isReady || !isAuthenticated || !isMerchant) {
    return <div className="min-h-screen bg-bibocom-light" />;
  }

  return (
    <MerchantShell
      section={section}
      onSectionChange={handleSectionChange}
      collapsed={collapsed}
      onToggleCollapsed={handleToggleCollapsed}
      mobileOpen={mobileOpen}
      onMobileOpenChange={setMobileOpen}
      displayName={displayName}
      onLogout={handleLogout}
      headerExtra={
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <button
            type="button"
            onClick={() => handleSectionChange("profile")}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-bibocom-primary shadow-sm"
            aria-label="Mon profil"
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      }
    >
      {section === "dashboard" && (
        <>
          {shopQuery.isError && !shopMissing ? (
            <Panel className="p-5">
              <p className="text-sm text-slate-500">{queryErrorMessage(shopQuery.error)}</p>
            </Panel>
          ) : hasShop || shopQuery.isPending ? (
            <MerchantOverview
              stats={statsQuery.data}
              chart={chartQuery.data}
              productStats={productStatsQuery.data}
              shop={shopQuery.data}
              loading={shopQuery.isPending || statsQuery.isPending}
              error={statsQuery.error}
              days={days}
              onDaysChange={setDays}
              onOpenOrder={(id) => {
                setSearchParams((prev) => {
                  const params = new URLSearchParams(prev);
                  params.set("view", "orders");
                  params.set("order", String(id));
                  return params;
                });
              }}
            />
          ) : (
            <MerchantShopView shop={null} loading={false} onShopChanged={refreshShop} />
          )}
        </>
      )}
      {section === "boutique" && (
        <MerchantShopView
          shop={hasShop ? shopQuery.data : null}
          loading={shopQuery.isPending}
          onShopChanged={refreshShop}
        />
      )}
      {section === "products" && (
        <MerchantProductsView
          merchantId={user?.id ?? null}
          hasShop={hasShop}
          enabled={enabled}
          onShopCreated={refreshShop}
        />
      )}
      {section === "orders" && (
        <MerchantOrdersView
          enabled={enabled}
          hasShop={hasShop}
          selectedOrderId={selectedOrderId}
          onSelectOrder={handleSelectOrder}
          onShopCreated={refreshShop}
          onMessageClient={(id) => {
            setSearchParams((prev) => {
              const params = new URLSearchParams(prev);
              params.set("view", "messages");
              params.set("partner", String(id));
              params.delete("order");
              return params;
            });
          }}
        />
      )}
      {section === "messages" && <MerchantMessagesView initialPartnerId={selectedPartnerId} />}
      {section === "profile" && <MerchantProfileView />}
    </MerchantShell>
  );
};

export default MerchantDashboard;
