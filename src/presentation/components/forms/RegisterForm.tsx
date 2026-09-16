"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { useNavigate, useLocation } from "react-router-dom";
import RegisterStep1 from "./register/RegisterStep1";
import {
  registerUser as apiRegisterUser,
  login,
  UserRole,
} from "@/services/authService";
import { appAlert } from "@/presentation/lib/swal";
import { dashboardPathFor } from "@/hooks/use-auth-session";


const formSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
    lastName: z
      .string()
      .min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
    phoneNumber: z.string().min(9, { message: "Numéro de téléphone invalide" }),
    password: z.string().min(6, {
      message: "Le mot de passe doit contenir au moins 6 caractères",
    }),
    email: z.string().email({ message: "Veuillez entrer une adresse email valide" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Veuillez confirmer votre mot de passe" }),
    role: z.nativeEnum(UserRole, {
      required_error: "Veuillez sélectionner un rôle",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof formSchema>;

const RegisterForm = ({
  onClose,
  initialRole = UserRole.CLIENT,
}: {
  onClose?: () => void;
  initialRole?: UserRole;
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(() => {
    const searchParams = new URLSearchParams(location.search);
    const stepParam = searchParams.get("registerStep");
    return stepParam ? parseInt(stepParam, 10) : 1;
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);


  // Initialiser le formulaire avec les valeurs par défaut
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      password: "",
      email: "",
      confirmPassword: "",
      role: initialRole,
    },
  });

  const updateStep = (step: number) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("registerStep", step.toString());

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState(null, "", newUrl);

    setCurrentStep(step);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const stepParam = searchParams.get("registerStep");

    if (stepParam) {
      const stepValue = parseInt(stepParam, 10);
      if (stepValue !== currentStep) {
        setCurrentStep(stepValue);
      }
    }
  }, [location.search, currentStep]);

  // Gestion du paramètre de rôle dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get("role");

    if (roleParam) {
      let roleValue: UserRole;

      // Mapper la valeur du paramètre vers un rôle UserRole
      if (roleParam.toLowerCase() === "client") {
        roleValue = UserRole.CLIENT;
      } else if (
        roleParam.toLowerCase() === "commercant" ||
        roleParam.toLowerCase() === "merchant"
      ) {
        roleValue = UserRole.MERCHANT;
      } else if (
        roleParam.toLowerCase() === "fournisseur" ||
        roleParam.toLowerCase() === "supplier"
      ) {
        roleValue = UserRole.SUPPLIER;
      } else {
        roleValue = initialRole;
      }

      form.setValue("role", roleValue);
    }
  }, [location.search]);

  // Charger les données sauvegardées du formulaire
  useEffect(() => {
    const savedFormData = localStorage.getItem("registerFormData");
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);

        Object.entries(parsedData).forEach(([key, value]) => {
          if (key !== "confirmPassword") {
            form.setValue(key as any, value as any);
          }
        });
      } catch (error) {
        console.error("Error loading saved form data:", error);
      }
    }
  }, []);

  // Sauvegarder les données du formulaire
  useEffect(() => {
    const subscription = form.watch((data) => {
      const dataToSave = { ...data };
      delete dataToSave.password;
      delete dataToSave.confirmPassword;

      localStorage.setItem('registerFormData', JSON.stringify(dataToSave));
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  // S'assurer que le rôle initial est correctement défini
  useEffect(() => {
    form.setValue("role", initialRole);
  }, [initialRole, form]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit(onSubmit)(e);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key !== "confirmPassword") {
          formData.append(key, String(value));
        }
      });

      await apiRegisterUser(formData);
      localStorage.removeItem("registerFormData");

      const searchParams = new URLSearchParams(location.search);
      searchParams.delete("registerStep");
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${searchParams.toString()}`
      );

      try {
        const session = await login({
          email: data.email,
          password: data.password,
        });
        navigate(dashboardPathFor(session.user.role));
      } catch {
        navigate("/login", {
          state: { initialEmail: data.email },
        });
      }

      if (onClose) onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue";
      const lower = message.toLowerCase();

      if (/email|e-mail|mail/.test(lower)) {
        form.setError("email", { type: "server", message });
      } else if (/téléphone|telephone|phone/.test(lower)) {
        form.setError("phoneNumber", { type: "server", message });
      } else if (/mot de passe|password/.test(lower)) {
        form.setError("password", { type: "server", message });
      } else {
        await appAlert.error("Inscription impossible", message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <RegisterStep1
          form={form}
          isSubmitting={isSubmitting}
        />
      </form>
    </Form>
  );
};

export default RegisterForm;
