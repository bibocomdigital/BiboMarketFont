"use client";

import NextLink from "next/link";
import {
  usePathname,
  useRouter,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import React, { useEffect, useState } from "react";

const NAV_STATE_KEY = "__bibo_nav_state";

type ToObject = {
  pathname?: string;
  search?: string;
  hash?: string;
  state?: unknown;
};

type To = string | number | ToObject;

function resolveTo(to: To): string {
  if (typeof to === "number") return "";
  if (typeof to === "string") return to;
  return `${to.pathname || ""}${to.search || ""}${to.hash || ""}`;
}

export function persistNavState(state: unknown) {
  if (typeof window === "undefined" || state === undefined) return;
  try {
    sessionStorage.setItem(NAV_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function readNavState(): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(NAV_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useNavigate() {
  const router = useRouter();

  return (to: To, options?: { replace?: boolean; state?: unknown }) => {
    if (typeof to === "number") {
      router.back();
      return;
    }

    persistNavState(options?.state ?? (typeof to === "object" ? to.state : undefined));
    const href = resolveTo(to);
    if (options?.replace) router.replace(href);
    else router.push(href);
  };
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const [state, setState] = useState<unknown>(null);

  useEffect(() => {
    setState(readNavState());
  }, [pathname, search]);

  return { pathname, search, hash: "", state };
}

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  return useNextParams() as T;
}

export function useSearchParams() {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = (
    next:
      | URLSearchParams
      | Record<string, string>
      | ((prev: URLSearchParams) => URLSearchParams)
  ) => {
    let params: URLSearchParams;
    if (typeof next === "function") {
      params = next(new URLSearchParams(searchParams.toString()));
    } else if (next instanceof URLSearchParams) {
      params = next;
    } else {
      params = new URLSearchParams(next);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return [searchParams, setSearchParams] as const;
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to?: To;
  href?: string;
  replace?: boolean;
  state?: unknown;
  children?: React.ReactNode;
};

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function CompatLink({ to, href, replace, state, children, onClick, ...props }, ref) {
    const dest = to !== undefined ? resolveTo(to) : href || "/";
    const linkState = state ?? (typeof to === "object" && to ? to.state : undefined);

    return (
      <NextLink
        href={dest || "/"}
        replace={replace}
        ref={ref}
        onClick={(event) => {
          persistNavState(linkState);
          onClick?.(event);
        }}
        {...props}
      >
        {children}
      </NextLink>
    );
  }
);

export function Navigate({ to, replace }: { to: To; replace?: boolean }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);

  return null;
}

export function BrowserRouter({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Routes({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Route() {
  return null;
}

export function Outlet() {
  return null;
}

export function NavLink(props: LinkProps) {
  return <Link {...props} />;
}
