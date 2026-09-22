"use client";

import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackButton({ className }: { className?: string }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "mb-6 inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-slate-500 transition-colors duration-300 hover:bg-slate-100 hover:text-slate-700",
        className
      )}
    >
      <ArrowLeft size={16} />
      Retour
    </button>
  );
}