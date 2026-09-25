"use client";

import React, { useMemo, useState } from 'react';
import { Store, MapPin, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useShopsQuery } from '@/hooks/queries/use-shops-query';
import { ServiceUnavailableState } from '@/components/feedback/ServiceUnavailableState';
import { formatImageUrl } from '@/services/productService';
import { VoirPlusButton } from '@/components/ui/voir-plus-button';

const PAGE_SIZE = 6;

const Shops = ({ hideWhenUnavailable = false }: { hideWhenUnavailable?: boolean }) => {
  const { data: shops = [], isPending, isError, isFetching, refetch } = useShopsQuery();
  const isLoading = isPending && shops.length === 0;
  const isUnavailable = isError && shops.length === 0;
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleShops = useMemo(
    () => shops.slice(0, visibleCount),
    [shops, visibleCount],
  );
  const remaining = Math.max(0, shops.length - visibleShops.length);

  const handleShowShopDetails = (shopId: number) => {
    navigate(`/boutique/${shopId}`);
  };

  if (isLoading) {
    return (
      <section className="overflow-hidden bg-gradient-to-b from-white to-bibocom-light/50 py-20">
        <div className="container mx-auto px-6 text-center sm:px-10">
          <p className="text-bibocom-primary">Chargement des boutiques...</p>
        </div>
      </section>
    );
  }

  if (isUnavailable) {
    if (hideWhenUnavailable) {
      return null;
    }

    return (
      <section className="overflow-hidden bg-white py-10">
        <div className="container mx-auto px-6 sm:px-10">
          <ServiceUnavailableState
            title="Boutiques temporairement indisponibles"
            description="Nous n'arrivons pas à afficher les commerçants pour le moment. Réessayez dans un instant."
            onRetry={() => {
              void refetch();
            }}
            isRetrying={isFetching}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden bg-gradient-to-b from-white to-bibocom-light/50 py-20">
      <div className="container mx-auto px-6 sm:px-10">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full bg-bibocom-accent/10 px-3 py-1 text-sm text-bibocom-accent">
            Nos Boutiques
          </span>
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">
            Découvrez <span className="text-gradient">nos commerçants</span>
          </h2>
          <p className="mx-auto max-w-2xl text-bibocom-primary/80">
            Explorez une variété de boutiques locales offrant des produits uniques et de qualité.
          </p>
        </div>

        {shops.length === 0 ? (
          <div className="text-center text-bibocom-primary/70">
            Aucune boutique disponible pour le moment.
          </div>
        ) : (
          <>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleShops.map((shop) => {
                const logo = formatImageUrl(shop.logo || null);
                return (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => handleShowShopDetails(shop.id)}
                    className="group flex h-full flex-col rounded-2xl bg-white p-6 text-left shadow-md transition-shadow hover:shadow-xl"
                  >
                    <div className="mb-4 flex items-center justify-center">
                      <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-bibocom-light shadow-md transition-transform duration-300 group-hover:scale-105">
                        {logo ? (
                          <img
                            src={logo}
                            alt={`Logo de ${shop.name}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-bibocom-light">
                            <Store className="h-12 w-12 text-bibocom-primary/70" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-semibold text-bibocom-primary group-hover:text-orange-500">
                        {shop.name}
                      </h4>
                      {shop.description && (
                        <p className="mt-2 line-clamp-3 text-sm italic text-bibocom-primary/80">
                          {shop.description}
                        </p>
                      )}
                      {shop.address && (
                        <div className="mt-3 flex items-center justify-center text-sm text-bibocom-primary/70">
                          <MapPin size={16} className="mr-2 shrink-0" />
                          <span>{shop.address}</span>
                        </div>
                      )}
                      {shop.phoneNumber && (
                        <div className="mt-2 flex items-center justify-center text-sm text-bibocom-primary/70">
                          <Phone size={16} className="mr-2 shrink-0" />
                          <span>{shop.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <VoirPlusButton
              remaining={remaining}
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              noun="boutique"
            />
          </>
        )}
      </div>
    </section>
  );
};

export default Shops;
