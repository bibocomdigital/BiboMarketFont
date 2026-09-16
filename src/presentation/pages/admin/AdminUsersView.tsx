"use client";

import React, { useMemo, useState } from "react";
import { getErrorStatus, getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import {
  ROLE_ORDER,
  fullName,
  roleLabel,
} from "@/lib/admin-analytics";
import {
  useAdminUsersListQuery,
  useDeleteAdminUserMutation,
  usePatchAdminUserMutation,
} from "@/hooks/queries/use-admin-query";
import {
  AdminInput,
  AdminSelect,
  ConfirmBar,
  GhostButton,
  PaginationBar,
  Panel,
  StateMessage,
  StatusPill,
  Td,
  Th,
  queryErrorMessage,
} from "./ui";

export function AdminUsersView({
  enabled,
  onMessageMerchant,
}: {
  enabled: boolean;
  onMessageMerchant?: (id: number) => void;
}) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const filters = useMemo(
    () => ({ page, limit: 20, role: role || undefined, search: search || undefined }),
    [page, role, search]
  );
  const query = useAdminUsersListQuery(filters, enabled);
  const patchUser = usePatchAdminUserMutation();
  const deleteUser = useDeleteAdminUserMutation();
  const users = query.data?.users ?? [];
  const pagination = query.data?.pagination;

  const notifyError = (error: unknown) => {
    const status = getErrorStatus(error);
    const message = getUserErrorMessage(error);
    if (status === 409) {
      setConflict(message);
      return;
    }
    toast({ title: "Action impossible", description: message, variant: "destructive" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <AdminInput
          value={draft}
          placeholder="Rechercher nom, email, téléphone"
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
          value={role}
          onChange={(event) => {
            setPage(1);
            setRole(event.target.value);
          }}
        >
          <option value="">Tous les rôles</option>
          {ROLE_ORDER.map((item) => (
            <option key={item} value={item}>
              {roleLabel(item)}
            </option>
          ))}
        </AdminSelect>
      </div>

      <Panel>
        {query.isPending && users.length === 0 ? (
          <StateMessage>Chargement des utilisateurs…</StateMessage>
        ) : query.isError ? (
          <StateMessage>{queryErrorMessage(query.error)}</StateMessage>
        ) : users.length === 0 ? (
          <StateMessage>Aucun utilisateur trouvé.</StateMessage>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <Th>Nom</Th>
                  <Th>Email</Th>
                  <Th>Téléphone</Th>
                  <Th>Ville</Th>
                  <Th>Rôle</Th>
                  <Th>Vérifié</Th>
                  <Th>Boutique</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 last:border-0">
                    <Td>{fullName(user)}</Td>
                    <Td>{user.email || "—"}</Td>
                    <Td>{user.phoneNumber || "—"}</Td>
                    <Td>{user.city || "—"}</Td>
                    <Td>
                      <AdminSelect
                        value={String(user.role || "")}
                        onChange={(event) =>
                          patchUser.mutate(
                            { id: user.id, body: { role: event.target.value } },
                            { onError: notifyError }
                          )
                        }
                      >
                        {ROLE_ORDER.map((item) => (
                          <option key={item} value={item}>
                            {roleLabel(item)}
                          </option>
                        ))}
                      </AdminSelect>
                    </Td>
                    <Td>
                      <StatusPill active={!!user.isVerified} />
                    </Td>
                    <Td>{user.shop?.name || "—"}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <GhostButton
                          onClick={() =>
                            patchUser.mutate(
                              { id: user.id, body: { isVerified: !user.isVerified } },
                              { onError: notifyError }
                            )
                          }
                        >
                          {user.isVerified ? "Retirer vérif." : "Vérifier"}
                        </GhostButton>
                        {String(user.role || "").toUpperCase() === "MERCHANT" && onMessageMerchant ? (
                          <GhostButton onClick={() => onMessageMerchant(user.id)}>Écrire</GhostButton>
                        ) : null}
                        <GhostButton onClick={() => setConfirmDelete(user.id)}>Supprimer</GhostButton>
                      </div>
                    </Td>
                  </tr>
                ))}
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

      {confirmDelete !== null && (
        <ConfirmBar
          title="Supprimer l’utilisateur"
          message="Cette action est définitive si aucune dépendance n’existe."
          confirmLabel="Supprimer"
          danger
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteUser.mutate(confirmDelete, {
              onError: notifyError,
              onSettled: () => setConfirmDelete(null),
            });
          }}
        />
      )}
      {conflict && (
        <ConfirmBar
          title="Suppression bloquée"
          message={conflict}
          confirmLabel="Fermer"
          onCancel={() => setConflict(null)}
          onConfirm={() => setConflict(null)}
        />
      )}
    </div>
  );
}
