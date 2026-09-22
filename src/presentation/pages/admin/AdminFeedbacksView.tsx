"use client";

import React, { useMemo, useState } from "react";
import { formatDateFr, formatFcfa, fullName } from "@/lib/admin-analytics";
import { useAdminFeedbacksQuery } from "@/hooks/queries/use-admin-query";
import {
  AdminInput,
  GhostButton,
  MobileCard,
  PaginationBar,
  Panel,
  StateMessage,
  Td,
  Th,
  queryErrorMessage,
} from "./ui";

export function AdminFeedbacksView({ enabled }: { enabled: boolean }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const filters = useMemo(
    () => ({ page, limit: 20, search: search || undefined }),
    [page, search]
  );
  const query = useAdminFeedbacksQuery(filters, enabled);
  const feedbacks = query.data?.feedbacks ?? [];
  const pagination = query.data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <AdminInput
          value={draft}
          placeholder="Rechercher un avis"
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
      </div>
      <Panel>
        {query.isPending && feedbacks.length === 0 ? (
          <StateMessage>Chargement des avis…</StateMessage>
        ) : query.isError ? (
          <StateMessage>{queryErrorMessage(query.error)}</StateMessage>
        ) : feedbacks.length === 0 ? (
          <StateMessage>Aucun avis pour le moment.</StateMessage>
        ) : (
          <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <Th>Note</Th>
                  <Th>Commentaire</Th>
                  <Th>Client</Th>
                  <Th>Commerçant</Th>
                  <Th>Boutique</Th>
                  <Th>Commande</Th>
                  <Th>Contact</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 last:border-0">
                    <Td>{item.rating}/5</Td>
                    <Td className="max-w-[280px] truncate">{item.comment || "—"}</Td>
                    <Td>{fullName(item.client)}</Td>
                    <Td>{fullName(item.merchant)}</Td>
                    <Td>{item.shop?.name || "—"}</Td>
                    <Td>
                      {item.order
                        ? `#${item.order.id} · ${formatFcfa(item.order.totalAmount)}`
                        : "—"}
                    </Td>
                    <Td>{item.contactSuccessful ? "Oui" : "Non"}</Td>
                    <Td>{formatDateFr(item.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-3 md:hidden">
            {feedbacks.map((item) => (
              <MobileCard key={item.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-amber-300">{item.rating}/5</span>
                  <span className="text-xs text-white/50">{formatDateFr(item.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-white/80">{item.comment || "—"}</p>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-white/40">Client</dt>
                    <dd className="text-white/80">{fullName(item.client)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Commerçant</dt>
                    <dd className="text-white/80">{fullName(item.merchant)}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Boutique</dt>
                    <dd className="text-white/80">{item.shop?.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Commande</dt>
                    <dd className="text-white/80">
                      {item.order ? `#${item.order.id} · ${formatFcfa(item.order.totalAmount)}` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-white/40">Contact</dt>
                    <dd className="text-white/80">{item.contactSuccessful ? "Oui" : "Non"}</dd>
                  </div>
                </dl>
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
    </div>
  );
}
