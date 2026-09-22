"use client";

import React, { useMemo, useState } from "react";
import { getErrorStatus, getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import { formatFcfa, productStatusLabel } from "@/lib/admin-analytics";
import {
  useAdminProductsListQuery,
  useDeleteAdminProductMutation,
  usePatchAdminProductMutation,
} from "@/hooks/queries/use-admin-query";
import {
  AdminInput,
  AdminSelect,
  ConfirmBar,
  GhostButton,
  MobileCard,
  PaginationBar,
  Panel,
  StateMessage,
  Td,
  Th,
  queryErrorMessage,
} from "./ui";

export function AdminProductsView({ enabled }: { enabled: boolean }) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [stockEdit, setStockEdit] = useState<{ id: number; stock: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [conflict, setConflict] = useState<{ message: string; productId: number } | null>(null);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
      lowStock: lowStock || undefined,
      lowStockThreshold: 10,
    }),
    [page, search, status, lowStock]
  );
  const query = useAdminProductsListQuery(filters, enabled);
  const patchProduct = usePatchAdminProductMutation();
  const deleteProduct = useDeleteAdminProductMutation();
  const products = query.data?.products ?? [];
  const pagination = query.data?.pagination;

  const notifyError = (error: unknown, productId?: number) => {
    const statusCode = getErrorStatus(error);
    const message = getUserErrorMessage(error);
    if (statusCode === 409 && productId) {
      setConflict({ message, productId });
      return;
    }
    toast({ title: "Action impossible", description: message, variant: "destructive" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <AdminInput
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
        <AdminSelect
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="PUBLISHED">Publié</option>
          <option value="DRAFT">Brouillon</option>
        </AdminSelect>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(event) => {
              setPage(1);
              setLowStock(event.target.checked);
            }}
          />
          Stock &lt; 10
        </label>
      </div>

      <Panel>
        {query.isPending && products.length === 0 ? (
          <StateMessage>Chargement des produits…</StateMessage>
        ) : query.isError ? (
          <StateMessage>{queryErrorMessage(query.error)}</StateMessage>
        ) : products.length === 0 ? (
          <StateMessage>Aucun produit trouvé.</StateMessage>
        ) : (
          <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <Th>Produit</Th>
                  <Th>Boutique</Th>
                  <Th>Catégorie</Th>
                  <Th>Prix</Th>
                  <Th>Stock</Th>
                  <Th>Statut</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-white/5 last:border-0">
                    <Td>
                      <div className="flex items-center gap-3">
                        {product.images?.[0]?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.images[0].imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                        ) : (
                          <span className="h-9 w-9 rounded-lg bg-white/10" />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </Td>
                    <Td>{product.shop?.name || "—"}</Td>
                    <Td>{product.categorieProd?.name || "—"}</Td>
                    <Td>{formatFcfa(product.price)}</Td>
                    <Td className={product.stock < 10 ? "text-amber-300" : undefined}>
                      {product.stock}
                    </Td>
                    <Td>{productStatusLabel(product.status)}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <GhostButton
                          onClick={() =>
                            patchProduct.mutate(
                              {
                                id: product.id,
                                body: {
                                  status: product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                                },
                              },
                              { onError: (error) => notifyError(error) }
                            )
                          }
                        >
                          {product.status === "PUBLISHED" ? "Dépublier" : "Publier"}
                        </GhostButton>
                        <GhostButton onClick={() => setStockEdit({ id: product.id, stock: product.stock })}>
                          Stock
                        </GhostButton>
                        <GhostButton onClick={() => setConfirmDelete(product.id)}>Supprimer</GhostButton>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-3 md:hidden">
            {products.map((product) => (
              <MobileCard key={product.id}>
                <div className="flex items-center gap-3">
                  {product.images?.[0]?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0].imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <span className="h-12 w-12 rounded-lg bg-white/10" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{product.name}</p>
                    <p className="truncate text-xs text-white/50">
                      {product.shop?.name || "—"} · {product.categorieProd?.name || "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/80">{formatFcfa(product.price)}</span>
                  <span className={product.stock < 10 ? "text-amber-300" : "text-white/60"}>
                    Stock : {product.stock}
                  </span>
                  <span className="text-xs text-white/50">{productStatusLabel(product.status)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <GhostButton
                    onClick={() =>
                      patchProduct.mutate(
                        {
                          id: product.id,
                          body: {
                            status: product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                          },
                        },
                        { onError: (error) => notifyError(error) }
                      )
                    }
                  >
                    {product.status === "PUBLISHED" ? "Dépublier" : "Publier"}
                  </GhostButton>
                  <GhostButton onClick={() => setStockEdit({ id: product.id, stock: product.stock })}>
                    Stock
                  </GhostButton>
                  <GhostButton onClick={() => setConfirmDelete(product.id)}>Supprimer</GhostButton>
                </div>
              </MobileCard>
            ))}
          </div>
          </>
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

      {stockEdit && (
        <ConfirmBar
          title="Mettre à jour le stock"
          message={
            <AdminInput
              type="number"
              min={0}
              value={stockEdit.stock}
              onChange={(event) =>
                setStockEdit({ ...stockEdit, stock: Number(event.target.value) })
              }
              className="mt-2 w-full"
            />
          }
          confirmLabel="Enregistrer"
          onCancel={() => setStockEdit(null)}
          onConfirm={() => {
            patchProduct.mutate(
              { id: stockEdit.id, body: { stock: stockEdit.stock } },
              { onError: (error) => notifyError(error), onSettled: () => setStockEdit(null) }
            );
          }}
        />
      )}
      {confirmDelete !== null && (
        <ConfirmBar
          title="Supprimer le produit"
          message="Le produit sera supprimé s’il n’est lié à aucune commande."
          confirmLabel="Supprimer"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            const id = confirmDelete;
            deleteProduct.mutate(id, {
              onError: (error) => notifyError(error, id),
              onSettled: () => setConfirmDelete(null),
            });
          }}
        />
      )}
      {conflict && (
        <ConfirmBar
          title="Suppression bloquée"
          message={conflict.message}
          confirmLabel="Passer en brouillon"
          onCancel={() => setConflict(null)}
          onConfirm={() => {
            patchProduct.mutate(
              { id: conflict.productId, body: { status: "DRAFT" } },
                              { onError: (error) => notifyError(error) }
            );
            setConflict(null);
          }}
        />
      )}
    </div>
  );
}
