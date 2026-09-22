"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Lock, Mail, MapPin, Phone, User, Users } from "lucide-react";
import { getUserErrorMessage } from "@domain/errors/app-error";
import { useToast } from "@/hooks/use-toast";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useFollowersQuery, useFollowingQuery, useProfileQuery } from "@/hooks/queries/use-user-query";
import {
  useChangePasswordMutation,
  useUpdateProfileMutation,
} from "@/hooks/mutations/use-auth-mutations";
import { USER_ROLE_LABELS, type UserRole } from "@/types/user";
import { AccentButton, GhostButton, MerchantInput, Panel, StateMessage } from "./ui";

type ProfileTab = "profile" | "followers" | "security";

function roleLabel(role?: string) {
  const key = String(role || "").toUpperCase() as UserRole;
  return USER_ROLE_LABELS[key] || role || "Commerçant";
}

export function MerchantProfileView() {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const profileQuery = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const [tab, setTab] = useState<ProfileTab>("profile");
  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const profile = profileQuery.data;
  const userId = profile?.id || user?.id || 0;
  const followersQuery = useFollowersQuery(userId || null);
  const followingQuery = useFollowingQuery(userId || null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    country: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const source = profile || user;
    if (!source) return;
    setForm({
      firstName: source.firstName || "",
      lastName: source.lastName || "",
      phone: source.phoneNumber || "",
      city: source.city || "",
      country: source.country || "",
    });
  }, [profile, user]);

  const display = useMemo(
    () => ({
      firstName: profile?.firstName || user?.firstName || "",
      lastName: profile?.lastName || user?.lastName || "",
      email: profile?.email || user?.email || "",
      phone: profile?.phoneNumber || user?.phoneNumber || "",
      city: profile?.city || user?.city || "",
      country: profile?.country || user?.country || "",
      photo: avatarPreview || profile?.photo?.toString() || user?.photo || "",
      role: profile?.role || user?.role || "MERCHANT",
    }),
    [avatarPreview, profile, user]
  );

  const followerCount = followersQuery.data?.pagination?.total ?? followersQuery.data?.followers?.length ?? 0;
  const followingCount = followingQuery.data?.pagination?.total ?? followingQuery.data?.following?.length ?? 0;
  const followers = followersQuery.data?.followers ?? [];
  const following = followingQuery.data?.following ?? [];

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phone,
        city: form.city,
        country: form.country,
        photo: avatarFile || undefined,
      });
      setEditing(false);
      setAvatarFile(null);
      toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
    } catch (error) {
      toast({
        title: "Mise à jour impossible",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handlePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Mots de passe différents",
        description: "Le nouveau mot de passe et sa confirmation ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await changePasswordMutation.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Mot de passe mis à jour", description: result.message });
    } catch (error) {
      toast({
        title: "Changement impossible",
        description: getUserErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  if (profileQuery.isPending && !profile && !user) {
    return <StateMessage>Chargement du profil…</StateMessage>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Panel className="p-5">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              {display.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String(display.photo)} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-md" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-bibocom-primary text-2xl font-semibold text-white">
                  {(display.firstName[0] || "").toUpperCase()}
                  {(display.lastName[0] || "").toUpperCase()}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }}
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 rounded-full bg-bibocom-accent p-1.5 text-white shadow-md transition-colors hover:bg-bibocom-primary"
                onClick={() => {
                  if (!editing) setEditing(true);
                  fileRef.current?.click();
                }}
                aria-label="Changer la photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="text-lg font-semibold">
              {display.firstName} {display.lastName}
            </h2>
            <p className="text-sm text-slate-500">{display.email}</p>
            <span className="mt-2 rounded-full bg-bibocom-primary/10 px-2.5 py-0.5 text-xs font-medium text-bibocom-primary">
              {roleLabel(display.role)}
            </span>
            <div className="mt-4 flex gap-8 text-sm">
              <div>
                <p className="font-semibold">{followerCount}</p>
                <p className="text-slate-500">Abonnés</p>
              </div>
              <div>
                <p className="font-semibold">{followingCount}</p>
                <p className="text-slate-500">Abonnements</p>
              </div>
            </div>
          </div>
          <nav className="mt-6 space-y-1">
            {[
              { id: "profile", label: "Mon profil", icon: User },
              { id: "followers", label: "Abonnés", icon: Users },
              { id: "security", label: "Sécurité", icon: Lock },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id as ProfileTab)}
                  className={`flex w-full items-center rounded-lg p-3 text-sm transition-colors ${
                    tab === item.id
                      ? "bg-bibocom-primary/10 text-bibocom-primary"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </Panel>

        {tab === "profile" && (
          <Panel className="p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold">Mon profil</h3>
                <p className="text-sm text-slate-500">Informations de votre compte commerçant</p>
              </div>
              {editing ? (
                <div className="flex gap-2">
                  <GhostButton
                    onClick={() => {
                      setEditing(false);
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                  >
                    Annuler
                  </GhostButton>
                  <AccentButton onClick={() => void handleSave()} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? "Enregistrement…" : "Enregistrer"}
                  </AccentButton>
                </div>
              ) : (
                <AccentButton onClick={() => setEditing(true)}>Modifier</AccentButton>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Prénom" editing={editing} value={form.firstName} display={display.firstName} onChange={(value) => setForm({ ...form, firstName: value })} />
              <Field label="Nom" editing={editing} value={form.lastName} display={display.lastName} onChange={(value) => setForm({ ...form, lastName: value })} />
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="h-4 w-4" /> Email
                </label>
                <p className="rounded-lg border border-slate-200 bg-bibocom-light px-3 py-2 text-sm">{display.email || "—"}</p>
              </div>
              <Field
                label="Téléphone"
                icon={<Phone className="h-4 w-4" />}
                editing={editing}
                value={form.phone}
                display={display.phone}
                onChange={(value) => setForm({ ...form, phone: value })}
              />
              <Field
                label="Ville"
                icon={<MapPin className="h-4 w-4" />}
                editing={editing}
                value={form.city}
                display={display.city}
                onChange={(value) => setForm({ ...form, city: value })}
              />
              <Field
                label="Pays"
                editing={editing}
                value={form.country}
                display={display.country}
                onChange={(value) => setForm({ ...form, country: value })}
              />
            </div>
          </Panel>
        )}

        {tab === "followers" && (
          <div className="space-y-4">
            <PeopleList
              title="Mes abonnés"
              empty="Vous n'avez pas encore d'abonnés."
              people={followers}
              loading={followersQuery.isPending}
            />
            <PeopleList
              title="Mes abonnements"
              empty="Vous ne suivez personne pour le moment."
              people={following}
              loading={followingQuery.isPending}
            />
          </div>
        )}

        {tab === "security" && (
          <Panel className="p-5">
            <h3 className="text-xl font-semibold">Sécurité</h3>
            <p className="mt-1 text-sm text-slate-500">Modifiez le mot de passe de votre compte.</p>
            <div className="mt-5 grid max-w-md gap-3">
              <MerchantInput
                type="password"
                placeholder="Mot de passe actuel"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
              />
              <MerchantInput
                type="password"
                placeholder="Nouveau mot de passe"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
              />
              <MerchantInput
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
              />
              <AccentButton
                className="w-fit"
                disabled={changePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword}
                onClick={() => void handlePassword()}
              >
                {changePasswordMutation.isPending ? "Mise à jour…" : "Mettre à jour le mot de passe"}
              </AccentButton>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  editing,
  value,
  display,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  editing: boolean;
  value: string;
  display: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </label>
      {editing ? (
        <MerchantInput value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <p className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{display || "Non renseigné"}</p>
      )}
    </div>
  );
}

function PeopleList({
  title,
  empty,
  people,
  loading,
}: {
  title: string;
  empty: string;
  people: Array<{ id: number; firstName: string; lastName: string; photo?: string | null; role?: string }>;
  loading: boolean;
}) {
  return (
    <Panel className="p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Chargement…</p>
      ) : people.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {people.map((person) => (
            <li key={person.id} className="flex items-center gap-3">
              {person.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={person.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bibocom-light text-sm font-medium">
                  {(person.firstName?.[0] || "").toUpperCase()}
                  {(person.lastName?.[0] || "").toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {person.firstName} {person.lastName}
                </p>
                <p className="text-xs text-slate-500">{roleLabel(person.role)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
