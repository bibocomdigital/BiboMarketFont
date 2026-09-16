"use client";

import React, { useMemo, useState } from "react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import { formatFcfa, productStatusLabel } from "@/lib/admin-analytics";
import { formatImageUrl } from "@/services/productService";
import {
  useMerchantCatalogQuery,
  useUpdateProductStatusMutation,
} from "@/hooks/queries/use-merchant-query";
import CreateProductModal from "@/components/shop/CreateProductModal";
import NoShop from "@/components/shop/NoShop";
import {
  AccentButton,
  GhostButton,
  MerchantInput,
  MerchantSelect,
  PaginationBar,
  Panel,
  StateMessage,
  Td,
  Th,
  queryErrorMessage,
} from "./ui";

export function MerchantProductsView({
  merchantId,
  hasShop,
  enabled,
  onShopCreated,
}: {
  merchantId: number | null;
  hasShop: boolean;
  enabled: boolean;
  onShopCreated: () => void;
}) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const query = useMerchantCatalogQuery(merchantId, page, 20, enabled && hasShop);
  const updateStatus = useUpdateProductStatusMutation();
  const products = query.data?.products ?? [];
  const pagination = query.data?.pagination;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        String(product.id).includes(term);
      const matchesStatus = !status || product.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, status]);

  if (!hasShop) {
    return <NoShop onShopCreated={onShopCreated} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <MerchantInput
          value={draft}
          placeholder="Rechercher un produit"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setPage(1);
              setSearch(draft.trim());
            }
          }}
          className="sm:max-w-sm"
        />
        <GhostButton
          onClick={() => {
            setPage(1);
            setSearch(draft.trim());
          }}
        >
          Rechercher
        </GhostButton>
        <MerchantSelect
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="PUBLISHED">Publié</option>
          <option value="DRAFT">Brouillon</option>
        </MerchantSelect>
        <AccentButton className="sm:ml-auto" onClick={() => setCreateOpen(true)}>
          Ajouter un produit
        </AccentButton>
      </div>

      <Panel>
        {query.isPending && products.length === 0 ? (
          <StateMessage>Chargement des produits…</StateMessage>
        ) : query.isError ? (
          <StateMessage>{queryErrorMessage(query.error)}</StateMessage>
        ) : filtered.length === 0 ? (
          <StateMessage>Aucun produit trouvé.</StateMessage>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>Produit</Th>
                  <Th>Prix</Th>
                  <Th>Stock</Th>
                  <Th>Statut</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const image = formatImageUrl(product.images?.[0]?.imageUrl || null);
                  const nextStatus = product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
                  return (
                    <tr key={product.id} className="border-b border-slate-100 last:border-0">
                      <Td>
                        <div className="flex items-center gap-3">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-bibocom-light" />
                          )}
                          <span className="max-w-[220px] truncate font-medium">{product.name}</span>
                        </div>
                      </Td>
                      <Td>{formatFcfa(product.price)}</Td>
                      <Td>{product.stock}</Td>
                      <Td>{productStatusLabel(product.status)}</Td>
                      <Td>
                        <GhostButton
                          disabled={updateStatus.isPending}
                          onClick={() =>
                            updateStatus.mutate(
                              { productId: product.id, status: nextStatus },
                              {
                                onError: (error) =>
                                  toast({
                                    title: "Statut non mis à jour",
                                    description: getUserErrorMessage(error),
                                    variant: "destructive",
                                  }),
                              }
                            )
                          }
                        >
                          {nextStatus === "PUBLISHED" ? "Publier" : "Mettre en brouillon"}
                        </GhostButton>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination ? (
          <PaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={setPage}
          />
        ) : null}
      </Panel>

      <CreateProductModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onProductCreated={() => {
          setCreateOpen(false);
          void query.refetch();
        }}
      />
    </div>
  );
}
