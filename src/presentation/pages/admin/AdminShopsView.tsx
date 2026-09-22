"use client";

import React, { useMemo, useState } from "react";
import { getErrorStatus, getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import { formatImageUrl } from "@/services/shopService";
import { fullName } from "@/lib/admin-analytics";
import {
  useAdminShopQuery,
  useAdminShopsListQuery,
  useDeleteAdminShopMutation,
  usePatchAdminShopMutation,
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
  StatusPill,
  Td,
  Th,
  queryErrorMessage,
} from "./ui";

export function AdminShopsView({ enabled }: { enabled: boolean }) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [verified, setVerified] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [conflict, setConflict] = useState<{ message: string; shopId: number } | null>(null);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
      verified: verified || undefined,
    }),
    [page, search, status, verified]
  );
  const query = useAdminShopsListQuery(filters, enabled);
  const detail = useAdminShopQuery(detailId, enabled && detailId !== null);
  const patchShop = usePatchAdminShopMutation();
  const deleteShop = useDeleteAdminShopMutation();
  const shops = query.data?.shops ?? [];
  const pagination = query.data?.pagination;

  const notifyError = (error: unknown, shopId?: number) => {
    const statusCode = getErrorStatus(error);
    const message = getUserErrorMessage(error);
    if (statusCode === 409 && shopId) {
      setConflict({ message, shopId });
      return;
    }
    toast({ title: "Action impossible", description: message, variant: "destructive" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <AdminInput
          value={draft}
          placeholder="Rechercher une boutique"
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
          <option value="">Toutes</option>
          <option value="true">Actives</option>
          <option value="false">Désactivées</option>
        </AdminSelect>
        <AdminSelect
          value={verified}
          onChange={(event) => {
            setPage(1);
            setVerified(event.target.value);
          }}
        >
          <option value="">Badge</option>
          <option value="true">Vérifiées</option>
          <option value="false">Non vérifiées</option>
        </AdminSelect>
      </div>

      <Panel>
        {query.isPending && shops.length === 0 ? (
          <StateMessage>Chargement des boutiques…</StateMessage>
        ) : query.isError ? (
          <StateMessage>{queryErrorMessage(query.error)}</StateMessage>
        ) : shops.length === 0 ? (
          <StateMessage>Aucune boutique trouvée.</StateMessage>
        ) : (
          <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <Th>Boutique</Th>
                  <Th>Commerçant</Th>
                  <Th>Catégorie</Th>
                  <Th>Produits</Th>
                  <Th>Active</Th>
                  <Th>Vérifiée</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop.id} className="border-b border-white/5 last:border-0">
                    <Td>
                      <button type="button" className="flex items-center gap-3 text-left" onClick={() => setDetailId(shop.id)}>
                        {shop.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={formatImageUrl(shop.logo) || shop.logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xs">
                            {(shop.name || "?").slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <span>{shop.name}</span>
                      </button>
                    </Td>
                    <Td>{fullName(shop.owner)}</Td>
                    <Td>{shop.categorieShop?.name || "—"}</Td>
                    <Td>{shop._count?.products ?? "—"}</Td>
                    <Td>
                      <StatusPill active={shop.status === true} />
                    </Td>
                    <Td>
                      <StatusPill active={shop.verifiedBadge === true} />
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <GhostButton
                          onClick={() =>
                            patchShop.mutate(
                              { id: shop.id, body: { verifiedBadge: !shop.verifiedBadge } },
                              { onError: (error) => notifyError(error) }
                            )
                          }
                        >
                          {shop.verifiedBadge ? "Retirer badge" : "Vérifier"}
                        </GhostButton>
                        <GhostButton
                          onClick={() =>
                            patchShop.mutate(
                              { id: shop.id, body: { status: !shop.status } },
                              { onError: (error) => notifyError(error) }
                            )
                          }
                        >
                          {shop.status ? "Désactiver" : "Activer"}
                        </GhostButton>
                        <GhostButton onClick={() => setConfirmDelete(shop.id)}>Supprimer</GhostButton>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-3 md:hidden">
            {shops.map((shop) => (
              <MobileCard key={shop.id}>
                <div className="flex items-center gap-3">
                  <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => setDetailId(shop.id)}>
                    {shop.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formatImageUrl(shop.logo) || shop.logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-xs">
                        {(shop.name || "?").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-white">{shop.name}</span>
                      <span className="block truncate text-xs text-white/50">{fullName(shop.owner)}</span>
                    </span>
                  </button>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-white/40">Catégorie</dt>
                    <dd className="text-white/80">{shop.categorieShop?.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Produits</dt>
                    <dd className="text-white/80">{shop._count?.products ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Statut</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      <StatusPill active={shop.status === true} />
                      <StatusPill active={shop.verifiedBadge === true} yes="Vérifiée" no="Non vérifiée" />
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <GhostButton
                    onClick={() =>
                      patchShop.mutate(
                        { id: shop.id, body: { verifiedBadge: !shop.verifiedBadge } },
                        { onError: (error) => notifyError(error) }
                      )
                    }
                  >
                    {shop.verifiedBadge ? "Retirer badge" : "Vérifier"}
                  </GhostButton>
                  <GhostButton
                    onClick={() =>
                      patchShop.mutate(
                        { id: shop.id, body: { status: !shop.status } },
                        { onError: (error) => notifyError(error) }
                      )
                    }
                  >
                    {shop.status ? "Désactiver" : "Activer"}
                  </GhostButton>
                  <GhostButton onClick={() => setConfirmDelete(shop.id)}>Supprimer</GhostButton>
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

      {detailId !== null && (
        <ConfirmBar
          title={detail.data?.name || "Boutique"}
          message={
            detail.isPending
              ? "Chargement…"
              : detail.isError
                ? queryErrorMessage(detail.error)
                : `Produits : ${detail.data?._count?.products ?? "—"} · Avis : ${detail.data?._count?.feedbacks ?? "—"} · Messages : ${detail.data?._count?.contactMessages ?? "—"}`
          }
          confirmLabel="Fermer"
          onCancel={() => setDetailId(null)}
          onConfirm={() => setDetailId(null)}
        />
      )}
      {confirmDelete !== null && (
        <ConfirmBar
          title="Supprimer la boutique"
          message="La boutique et ses produits seront supprimés s’il n’y a pas de commandes liées."
          confirmLabel="Supprimer"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            const id = confirmDelete;
            deleteShop.mutate(id, {
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
          confirmLabel="Désactiver la boutique"
          cancelLabel="Fermer"
          onCancel={() => setConflict(null)}
          onConfirm={() => {
            patchShop.mutate(
              { id: conflict.shopId, body: { status: false } },
              { onError: (error) => notifyError(error) }
            );
            setConflict(null);
          }}
        />
      )}
    </div>
  );
}
