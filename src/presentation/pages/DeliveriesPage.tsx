"use client";

import React, { useEffect, useState } from "react";
import { PublicShell } from "@/components/home/PublicShell";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { listDeliveryServices, type DeliveryService } from "@/services/platformService";

export default function DeliveriesPage() {
  const [services, setServices] = useState<DeliveryService[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDeliveryServices()
      .then((rows) => setServices(Array.isArray(rows) ? rows : []))
      .catch((err) => setError(getUserErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicShell>
      <div className="py-2 sm:py-4">
        <h1 className="text-2xl font-semibold text-bibocom-primary sm:text-3xl">Livraisons</h1>
        <p className="mt-2 text-sm text-slate-600">
          Services de livraison proposés par les fournisseurs.
        </p>
        {loading ? (
          <div className="mt-8 flex justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-bibocom-accent border-t-transparent" role="status" aria-label="Chargement" />
          </div>
        ) : null}
        {error ? <p className="mt-6 text-sm text-bibocom-error">{error}</p> : null}
        {!loading && !error && services.length === 0 ? (
          <p className="mt-8 text-sm text-slate-500">Aucun service publié pour le moment.</p>
        ) : null}
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <li key={service.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-bibocom-primary">{service.name}</p>
                  {service.description ? <p className="mt-1 text-sm text-slate-600">{service.description}</p> : null}
                  <p className="mt-2 break-words text-xs text-slate-500">
                    {service.zone || "Zone non précisée"}
                    {service.provider?.phoneNumber ? ` · ${service.provider.phoneNumber}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-bibocom-accent">{service.price} F CFA</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PublicShell>
  );
}
