"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  left: ReactNode;
  children: ReactNode;
  contentClassName?: string;
};

export function AuthSplitLayout({
  left,
  children,
  contentClassName,
}: AuthSplitLayoutProps) {
  return (
    <div className="auth-page h-dvh w-full overflow-hidden bg-white font-sans antialiased">
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-2">
        <aside className="relative hidden h-full w-full overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#07233d_0%,#0A2540_48%,#123a63_100%)]" />
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#2b6cb0]/25 blur-3xl" />
          <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-bibocom-secondary/20 blur-3xl" />
          <div className="absolute left-1/3 -bottom-24 h-64 w-64 rounded-full bg-[#1d4e89]/30 blur-3xl" />
          <div className="relative z-10 flex h-full w-full">{left}</div>
        </aside>

        <main className="flex h-full w-full overflow-y-auto bg-white px-4 py-8 sm:px-6 sm:py-10">
          <div
            className={cn(
              "m-auto w-full max-w-[420px] animate-login-slide-up",
              contentClassName
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
