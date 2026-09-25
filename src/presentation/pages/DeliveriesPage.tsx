"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { listDeliveryServices, type DeliveryService } from "@/services/platformService";

export default function DeliveriesPage() {
  const [services, setServices] = useState<DeliveryService[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listDeliveryServices()
      .then((rows) => setServices(Array.isArray(rows) ? rows : []))
      .catch((err) => setError(getUserErrorMessage(err)));
  }, []);

  return (
    <div className="min-h-screen bg-bibocom-light pt-20 md:pt-24">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-semibold text-bibocom-primary">Livraisons</h1>
        <p className="mt-2 text-sm text-slate-600">
          Services de livraison proposés par les fournisseurs.
        </p>
        {error ? <p className="mt-6 text-sm text-bibocom-error">{error}</p> : null}
        {!error && services.length === 0 ? (
          <p className="mt-8 text-sm text-slate-500">Aucun service publié pour le moment.</p>
        ) : null}
        <ul className="mt-6 space-y-3">
          {services.map((service) => (
            <li key={service.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-bibocom-primary">{service.name}</p>
                  {service.description ? <p className="mt-1 text-sm text-slate-600">{service.description}</p> : null}
                  <p className="mt-2 text-xs text-slate-500">
                    {service.zone || "Zone non précisée"}
                    {service.provider?.phoneNumber ? ` · ${service.provider.phoneNumber}` : ""}
                  </p>
                </div>
                <p className="text-sm font-semibold text-bibocom-accent">{service.price} F CFA</p>
              </div>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
