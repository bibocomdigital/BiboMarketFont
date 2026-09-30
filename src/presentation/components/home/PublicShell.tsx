"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HomeMenu } from "@/components/home/HomeRails";

/** Cadre des pages publiques : en-tête, menu latéral, contenu. */
export function PublicShell({
  children,
  bare = false,
  bareClassName = "",
}: {
  children: React.ReactNode;
  bare?: boolean;
  bareClassName?: string;
}) {
  if (bare) return <div className={bareClassName}>{children}</div>;

  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip bg-[#f6f7fb]">
      <Header />
      <div className="w-full min-w-0 flex-1 pt-32 md:pt-24">
        <div className="grid min-w-0 gap-3 px-3 py-3 md:grid-cols-[280px_minmax(0,1fr)] md:items-start">
          <aside className="hidden md:sticky md:top-24 md:z-20 md:block md:self-start">
            <HomeMenu />
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
