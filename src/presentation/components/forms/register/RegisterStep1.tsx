"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store, User, UserPlus } from "lucide-react";
import { RegisterFormValues } from "../RegisterForm";
import PhoneInput from "./PhoneInput";
import PasswordInput from "../login/PasswordInput";
import { UserRole, USER_ROLE_LABELS } from "@/types/user";
import { cn } from "@/lib/utils";

interface RegisterStep1Props {
  form: UseFormReturn<RegisterFormValues>;
  isSubmitting?: boolean;
}

const fieldClassName =
  "h-12 rounded-xl border-slate-200 bg-white shadow-none transition-all duration-300 focus-visible:ring-bibocom-primary/20 focus-visible:border-bibocom-primary";

const roleOptions = [
  { value: UserRole.CLIENT, icon: User },
  { value: UserRole.MERCHANT, icon: Store },
  // { value: UserRole.SUPPLIER, icon: Package },
];

const RegisterStep1 = ({ form, isSubmitting }: RegisterStep1Props) => {
  return (
    <>
      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-[13px] font-medium tracking-wide text-slate-600">
              Je m&apos;inscris en tant que *
            </FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map((option) => {
                  const selected = field.value === option.value;
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        "flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all duration-300",
                        selected
                          ? "border-bibocom-primary bg-bibocom-primary/10 text-bibocom-primary shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <Icon size={16} />
                      {USER_ROLE_LABELS[option.value]}
                    </button>
                  );
                })}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium tracking-wide text-slate-600">
                Prénom *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Votre prénom"
                  className={fieldClassName}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium tracking-wide text-slate-600">
                Nom *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Votre nom"
                  className={fieldClassName}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="phoneNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[13px] font-medium tracking-wide text-slate-600">
              Téléphone *
            </FormLabel>
            <FormControl>
              <PhoneInput form={form} field={field} className={fieldClassName} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium tracking-wide text-slate-600">
                Mot de passe *
              </FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Votre mot de passe"
                  className={fieldClassName}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[13px] font-medium tracking-wide text-slate-600">
                Confirmer le mot de passe *
              </FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="Confirmez votre mot de passe"
                  className={fieldClassName}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(["city", "department", "commune"] as const).map((name) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[13px] font-medium tracking-wide text-slate-600">
                  {name === "city" ? "Ville" : name === "department" ? "Département" : "Commune"}
                </FormLabel>
                <FormControl>
                  <Input placeholder="Optionnel" className={fieldClassName} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
      </div>

      <Button
        type="submit"
        className={cn(
          "h-12 w-full rounded-xl bg-bibocom-primary text-white shadow-sm",
          "transition-all duration-300 hover:bg-[#081c30] hover:shadow-md hover:scale-[1.01]"
        )}
        disabled={isSubmitting || !form.getValues().role}
      >
        <UserPlus className="h-4 w-4" />
        {isSubmitting ? "Inscription en cours..." : "S'inscrire"}
      </Button>
    </>
  );
};

export default RegisterStep1;
