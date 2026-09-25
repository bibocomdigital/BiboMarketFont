"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logout } from "@/services/authService";
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
    return <div className="min-h-screen bg-bibocom-light" />;
  }

  return (
    <div className="min-h-screen bg-bibocom-light">
      <div className="bg-bibocom-primary text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Tableau de bord Fournisseur</h1>
          <Button variant="outline" onClick={handleLogout} className="bg-white text-bibocom-primary">
            Se déconnecter
          </Button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <MerchantBadgeView />
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
      </main>
    </div>
  );
};

export default SupplierDashboard;
