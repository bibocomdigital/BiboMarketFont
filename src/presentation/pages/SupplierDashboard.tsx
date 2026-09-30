"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, LayoutDashboard, LogOut, Menu, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logout, getPhotoUrl } from "@/services/authService";
import { AppLogo } from "@/components/brand/AppLogo";
import NotificationCenter from "@/components/notification/NotificationCenter ";
import { dashboardPathFor, hasStoredCredentials, useAuthSession } from "@/hooks/use-auth-session";
import { MerchantBadgeView } from "./merchant/MerchantBadgeView";
import { useToast } from "@/hooks/use-toast";
import { getUserErrorMessage } from "@domain/errors/app-error";
import {
  createService,
  deleteService,
  listMyServices,
  updateService,
  type DeliveryService,
} from "@/services/platformService";

const SupplierDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated, isReady } = useAuthSession();
  const isSupplier = ["SUPPLIER", "FOURNISSEUR"].includes(String(user?.role || "").toUpperCase());
  const [services, setServices] = useState<DeliveryService[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [zone, setZone] = useState("");
  const [price, setPrice] = useState("");
  const [pending, setPending] = useState(false);
  const [section, setSection] = useState<"home" | "badge">("home");
  const [mobileOpen, setMobileOpen] = useState(false);

  const load = () => {
    listMyServices()
      .then((rows) => setServices(Array.isArray(rows) ? rows : []))
      .catch((err) => setError(getUserErrorMessage(err)));
  };

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      if (hasStoredCredentials()) return;
      navigate("/login", { replace: true });
      return;
    }
    if (!isSupplier) {
      navigate(dashboardPathFor(user?.role), { replace: true });
    }
  }, [isReady, isAuthenticated, isSupplier, navigate, user?.role]);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !isSupplier) return;
    load();
  }, [isReady, isAuthenticated, isSupplier]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès.",
    });
    navigate("/login", { replace: true });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await createService({
        name: name.trim(),
        description: description.trim(),
        zone: zone.trim(),
        price: Number(price),
      });
      setName("");
      setDescription("");
      setZone("");
      setPrice("");
      load();
    } catch (err) {
      setError(getUserErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  if (!isReady || !isAuthenticated || !isSupplier) {
    return <div className="min-h-screen bg-[#f6f7fb]" />;
  }

  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const photoUrl = getPhotoUrl(user?.photo);
  const nav = [
    { id: "home" as const, label: "Accueil", icon: LayoutDashboard },
    { id: "badge" as const, label: "Badge", icon: BadgeCheck },
  ];

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="px-4 py-4">
        <AppLogo href={null} className="h-8 max-w-[150px]" />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSection(item.id);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                active ? "bg-orange-50 text-bibocom-accent" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 px-3 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-bibocom-primary">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[230px] border-r border-slate-200 bg-white md:block">
        {sidebar}
      </aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" className="absolute inset-0 bg-bibocom-primary/40" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 h-full w-[240px] bg-white shadow-2xl">{sidebar}</aside>
        </div>
      ) : null}
      <div className="md:pl-[230px]">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-slate-200 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <AppLogo className="h-8 max-w-[140px] md:hidden" />
          <p className="hidden text-sm font-semibold lg:block">{section === "badge" ? "Badge et stories" : "Services de livraison"}</p>
          <div className="ml-auto flex items-center gap-2">
            <NotificationCenter />
            <div className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-bibocom-accent">
                  <Truck className="h-4 w-4" />
                </span>
              )}
              <span className="hidden text-left lg:block">
                <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight">{displayName || "Fournisseur"}</span>
                <span className="block text-[11px] text-slate-400">Fournisseur</span>
              </span>
            </div>
          </div>
        </header>
        <main className="space-y-6 px-4 py-5 sm:px-6">
          {section === "badge" ? <MerchantBadgeView /> : null}
          {section === "home" ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-xl font-semibold text-bibocom-primary">Services de livraison</h2>
          <p className="mt-2 text-sm text-slate-600">
            Publiez les zones et les tarifs que les commerçants peuvent consulter.
          </p>
          <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom du service" required />
            <Input value={zone} onChange={(event) => setZone(event.target.value)} placeholder="Zone, ex. Dakar" />
            <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" />
            <Input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Prix en F CFA"
              inputMode="numeric"
              required
            />
            <Button type="submit" disabled={pending} className="bg-bibocom-primary text-white md:col-span-2">
              {pending ? "Enregistrement…" : "Publier le service"}
            </Button>
          </form>
          {error ? <p className="mt-3 text-sm text-bibocom-error">{error}</p> : null}
          <ul className="mt-6 space-y-3">
            {services.map((service) => (
              <li key={service.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bibocom-light px-4 py-3">
                <div>
                  <p className="font-medium text-bibocom-primary">
                    {service.name} · {service.price} F CFA
                  </p>
                  <p className="text-sm text-slate-600">
                    {service.zone || "Zone non précisée"}
                    {service.active === false ? " · masqué" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => updateService(service.id, { active: service.active === false }).then(load)}
                  >
                    {service.active === false ? "Publier" : "Masquer"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => deleteService(service.id).then(load).catch((err) => setError(getUserErrorMessage(err)))}
                  >
                    Supprimer
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default SupplierDashboard;
