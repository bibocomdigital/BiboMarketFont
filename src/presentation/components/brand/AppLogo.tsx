"use client";

import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function AppLogo({
  className,
  href = "/",
  framed = false,
}: {
  className?: string;
  href?: string | null;
  framed?: boolean;
}) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo.png"
      alt="Bibocom Market"
      className={cn(
        "h-9 w-auto max-w-[190px] object-contain object-left",
        framed && "rounded-lg bg-white px-1",
        className
      )}
    />
  );

  if (!href) return image;
  return (
    <Link to={href} className="inline-flex shrink-0 items-center" aria-label="Bibocom Market">
      {image}
    </Link>
  );
}
