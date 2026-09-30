"use client";

import { AppLogo } from "@/components/brand/AppLogo";

export function AuthBrand({ light = false }: { light?: boolean }) {
  return <AppLogo framed={light} className="h-10 max-w-[210px]" />;
}
