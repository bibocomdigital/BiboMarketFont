"use client";

import React, { useState, useEffect, useRef } from "react";
import { Menu, X, ShoppingCart, Search, ChevronDown, LogOut, User } from "lucide-react";
import Button from "./ui-custom/Button";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useShopCategoriesQuery } from "@/hooks/queries/use-shop-categories-query";
import { useAuthSession } from "@/hooks/use-auth-session";
import { useCart } from "@/components/CartContext";
import { getPhotoUrl } from "@/services/authService";
import { AppLogo } from "@/components/brand/AppLogo";
import { HomeMenu } from "@/components/home/HomeRails";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, dashboardPath, logout } = useAuthSession();
  const { itemsCount } = useCart();
  const { data: categories = [], isPending } = useShopCategoriesQuery();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoriesPinned, setCategoriesPinned] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [headerQuery, setHeaderQuery] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);
  const withMenu =
    location.pathname === "/" ||
    ["/boutique", "/boutiques", "/stories", "/livraisons", "/about", "/contact", "/cart"].some(
      (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    );
  const activeCategoryId = new URLSearchParams(location.search).get("categorieShopId");

  useEffect(() => {
    setHeaderQuery(new URLSearchParams(location.search).get("q") || "");
  }, [location.search]);

  const submitHeaderSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(location.search);
    const next = headerQuery.trim();
    if (next) params.set("q", next);
    else params.delete("q");
    const qs = params.toString();
    navigate(qs ? `/?${qs}` : "/");
    window.setTimeout(() => {
      document.getElementById("produits")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    if (!isMobileMenuOpen) return () => {
      document.body.style.overflow = "";
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isMobileMenuOpen]);

  const cancelCategoryClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const closeCategories = () => {
    cancelCategoryClose();
    setCategoriesPinned(false);
    setCategoriesOpen(false);
  };

  const openCategoriesFromHover = () => {
    cancelCategoryClose();
    setCategoriesOpen(true);
  };

  const closeCategoriesFromHover = () => {
    if (categoriesPinned) return;
    cancelCategoryClose();
    closeTimer.current = window.setTimeout(() => setCategoriesOpen(false), 160);
  };

  useEffect(() => {
    closeCategories();
  }, [location.pathname, location.search]);

  useEffect(() => () => cancelCategoryClose(), []);

  useEffect(() => {
    if (!categoriesOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!categoriesRef.current?.contains(event.target as Node)) {
        closeCategories();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCategories();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [categoriesOpen, categoriesPinned]);

  const closeMobile = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMobile();
    navigate("/", { replace: true });
  };

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : "";
  const photoUrl = getPhotoUrl(user?.photo);

  useEffect(() => {
    setPhotoFailed(false);
  }, [photoUrl]);

  const navClass = (href: string, exact = false) => {
    const path = location.pathname;
    const active = exact ? path === href : path === href || path.startsWith(`${href}/`);
    return cn(
      "whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors duration-200",
      active
        ? "bg-bibocom-primary/10 text-bibocom-accent"
        : "text-bibocom-primary hover:bg-bibocom-primary/5 hover:text-bibocom-accent"
    );
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 w-full transition-all duration-300",
          "bg-bibocom-light/95 backdrop-blur-md",
          isScrolled
            ? "border-b border-slate-200/80 py-3 shadow-sm"
            : "border-b border-transparent py-4 md:py-5"
        )}
      >
        <div className="px-3">
          {withMenu ? (
            <div className="flex flex-col gap-2 md:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-bibocom-primary ring-1 ring-slate-200"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Ouvrir le menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <Menu size={22} />
                </button>
                <AppLogo className="h-8 min-w-0" />
                <Link
                  to="/cart"
                  data-cart-target=""
                  className="relative ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-bibocom-primary"
                  aria-label="Panier"
                >
                  <ShoppingCart size={20} />
                  {itemsCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-bibocom-accent text-[10px] text-white">
                      {itemsCount > 9 ? "9+" : itemsCount}
                    </span>
                  )}
                </Link>
              </div>
              <form onSubmit={submitHeaderSearch} className="flex min-w-0 items-center">
                <label className="sr-only" htmlFor="header-search-mobile">Rechercher un produit</label>
                <input
                  id="header-search-mobile"
                  value={headerQuery}
                  onChange={(event) => setHeaderQuery(event.target.value)}
                  placeholder="Rechercher..."
                  className="min-w-0 flex-1 rounded-l-full border border-slate-200 bg-white px-4 py-2 text-sm text-bibocom-primary outline-none placeholder:text-slate-400 focus:border-bibocom-accent"
                />
                <button
                  type="submit"
                  className="inline-flex h-[38px] shrink-0 items-center rounded-r-full bg-bibocom-accent px-4 text-white"
                  aria-label="Rechercher"
                >
                  <Search size={16} />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2 md:hidden">
              <AppLogo className="h-8 min-w-0" />
              <Link
                to="/cart"
                data-cart-target=""
                className="relative ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-bibocom-primary"
                aria-label="Panier"
              >
                <ShoppingCart size={20} />
                {itemsCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-bibocom-accent text-[10px] text-white">
                    {itemsCount > 9 ? "9+" : itemsCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-bibocom-primary ring-1 ring-slate-200"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Ouvrir le menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Menu size={22} />
              </button>
            </div>
          )}

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex shrink-0 items-center">
              <AppLogo className="h-8 sm:h-10" />
            </div>

            <nav className={cn("hidden min-w-0 items-center gap-0.5 lg:flex xl:gap-1", withMenu ? "" : "flex-1 justify-center")}>
              {withMenu ? null : (
              <Link to="/" className={navClass("/", true)}>
                Accueil
              </Link>
              )}

              <div
                className="relative"
                ref={categoriesRef}
                onMouseEnter={openCategoriesFromHover}
                onMouseLeave={closeCategoriesFromHover}
              >
                <button
                  type="button"
                  className={cn(
                    "flex items-center whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors duration-200",
                    activeCategoryId
                      ? "bg-bibocom-primary/10 text-bibocom-accent"
                      : "text-bibocom-primary hover:bg-bibocom-primary/5 hover:text-bibocom-accent"
                  )}
                  aria-expanded={categoriesOpen}
                  aria-haspopup="true"
                  onClick={() => {
                    cancelCategoryClose();
                    if (categoriesPinned) {
                      closeCategories();
                      return;
                    }
                    setCategoriesPinned(true);
                    setCategoriesOpen(true);
                  }}
                >
                  Catégories
                  <ChevronDown
                    size={16}
                    className={cn("ml-1 transition-transform duration-300", categoriesOpen && "rotate-180")}
                  />
                </button>
                {categoriesOpen && (
                  <div className="absolute left-0 top-full z-50 pt-2">
                    <div className="max-h-[70vh] w-72 overflow-y-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-100">
                    {isPending && categories.length === 0 ? (
                      <p className="px-4 py-2 text-sm text-slate-500">Chargement...</p>
                    ) : categories.length === 0 ? (
                      <p className="px-4 py-2 text-sm text-slate-500">Aucune catégorie</p>
                    ) : (
                      categories.map((category) => {
                        const selected = activeCategoryId === String(category.id);
                        return (
                          <div key={category.id} className="py-1">
                            <Link
                              to={`/boutique?categorieShopId=${category.id}`}
                              className={cn(
                                "block px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-bibocom-primary/10",
                                selected ? "bg-bibocom-accent/10 text-bibocom-accent" : "text-bibocom-primary"
                              )}
                              onClick={closeCategories}
                            >
                              {category.name}
                            </Link>
                            {Array.isArray(category.prodCategories) &&
                              category.prodCategories.map((prod) => (
                                <Link
                                  key={prod.id}
                                  to={`/?category=${prod.id}`}
                                  className="block px-6 py-1.5 text-sm text-slate-600 transition-colors duration-200 hover:bg-bibocom-primary/10 hover:text-bibocom-primary"
                                  onClick={closeCategories}
                                >
                                  {prod.name}
                                </Link>
                              ))}
                          </div>
                        );
                      })
                    )}
                    </div>
                  </div>
                )}
              </div>

              {withMenu ? null : (
                <>
              <Link to="/boutique" className={navClass("/boutique")}>
                Boutiques
              </Link>
              <Link to="/stories" className={navClass("/stories")}>
                Stories
              </Link>
              <Link to="/livraisons" className={navClass("/livraisons")}>
                Livraisons
              </Link>
              <Link to="/about" className={navClass("/about")}>
                À propos
              </Link>
              <Link to="/contact" className={navClass("/contact")}>
                Contact
              </Link>
                </>
              )}
            </nav>

            {withMenu ? (
              <form onSubmit={submitHeaderSearch} className="flex min-w-0 flex-1 items-center">
                <label className="sr-only" htmlFor="header-search">Rechercher un produit</label>
                <input
                  id="header-search"
                  value={headerQuery}
                  onChange={(event) => setHeaderQuery(event.target.value)}
                  placeholder="Rechercher un produit, une catégorie..."
                  className="min-w-0 flex-1 rounded-l-full border border-slate-200 bg-white px-4 py-2 text-sm text-bibocom-primary outline-none placeholder:text-slate-400 focus:border-bibocom-accent"
                />
                <button
                  type="submit"
                  className="inline-flex h-[38px] items-center gap-2 rounded-r-full bg-bibocom-accent px-4 text-sm font-semibold text-white"
                  aria-label="Rechercher"
                >
                  <Search size={16} />
                </button>
              </form>
            ) : null}

            <div className="flex shrink-0 items-center gap-2 xl:gap-3">
              <button
                type="button"
                className={cn(
                  "text-bibocom-primary hover:text-bibocom-accent transition-colors duration-300",
                  withMenu && "hidden"
                )}
                aria-label="Rechercher"
                onClick={() => {
                  if (!withMenu) navigate("/");
                }}
              >
                <Search size={20} />
              </button>
              <Link
                to="/cart"
                data-cart-target=""
                className="text-bibocom-primary hover:text-bibocom-accent transition-colors duration-300 relative"
                aria-label="Panier"
              >
                <ShoppingCart size={20} />
                {itemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-bibocom-accent text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {itemsCount > 9 ? "9+" : itemsCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardPath}
                    className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-bibocom-primary/5"
                    title="Tableau de bord"
                  >
                    {photoUrl && !photoFailed ? (
                      <img
                        src={photoUrl}
                        alt={displayName}
                        className="h-8 w-8 rounded-full object-cover"
                        onError={() => setPhotoFailed(true)}
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bibocom-primary text-white" aria-hidden>
                        <User size={16} />
                      </span>
                    )}
                    <span className="hidden max-w-[9rem] truncate text-sm font-medium whitespace-nowrap text-bibocom-primary xl:inline">
                      {displayName}
                    </span>
                  </Link>
                  <Button size="sm" variant="outline" onClick={handleLogout} icon={<LogOut size={14} />}>
                    Déconnexion
                  </Button>
                </>
              ) : withMenu ? null : (
                <>
                  <Link to="/login">
                    <Button size="sm" variant="outline">
                      Se connecter
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">S&apos;inscrire</Button>
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      {isMobileMenuOpen && withMenu ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-bibocom-primary/40"
            aria-label="Fermer le menu"
            onClick={closeMobile}
          />
          <div className="relative flex h-full w-[min(100%,20rem)] max-w-full flex-col bg-[#f6f7fb] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-base font-semibold text-bibocom-primary">Menu</p>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-bibocom-primary ring-1 ring-slate-200"
                onClick={closeMobile}
                aria-label="Fermer le menu"
              >
                <X size={22} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
              <HomeMenu stacked onNavigate={closeMobile} />
            </div>
          </div>
        </div>
      ) : null}

      {isMobileMenuOpen && !withMenu ? (
      <div className="fixed inset-0 z-[60] flex flex-col bg-bibocom-light lg:hidden">
        <div className="flex h-full flex-col overflow-y-auto px-5 pb-8 pt-4">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
            <AppLogo href={null} className="h-8" />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-bibocom-primary ring-1 ring-slate-200"
              onClick={closeMobile}
              aria-label="Fermer le menu"
            >
              <X size={22} />
            </button>
          </div>
          <nav className="flex flex-col">
            {isAuthenticated && !withMenu && (
              <Link
                to={dashboardPath}
                className="border-b border-slate-100 py-3 text-base font-medium text-bibocom-primary"
                onClick={closeMobile}
              >
                Tableau de bord
              </Link>
            )}
            <Link
              to="/"
              className={cn("border-b border-slate-100 py-3 text-base font-medium text-bibocom-primary", withMenu && "hidden")}
              onClick={closeMobile}
            >
              Accueil
            </Link>
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-between border-b border-slate-100 py-3 text-base font-medium text-bibocom-primary"
                onClick={() => setMobileCategoriesOpen((open) => !open)}
              >
                Catégories
                <ChevronDown
                  size={18}
                  className={cn(
                    "transition-transform",
                    mobileCategoriesOpen && "rotate-180"
                  )}
                />
              </button>
              {mobileCategoriesOpen && (
                <div className="mt-3 space-y-2 pl-2">
                  {categories.map((category) => (
                    <div key={category.id}>
                      <Link
                        to={`/boutique?categorieShopId=${category.id}`}
                        className="block py-1 text-base font-medium text-bibocom-primary"
                        onClick={closeMobile}
                      >
                        {category.name}
                      </Link>
                      {Array.isArray(category.prodCategories) &&
                        category.prodCategories.map((prod) => (
                          <Link
                            key={prod.id}
                            to={`/?category=${prod.id}`}
                            className="block py-1 pl-3 text-sm text-slate-600"
                            onClick={closeMobile}
                          >
                            {prod.name}
                          </Link>
                        ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {withMenu ? null : (
            <>
            <Link
              to="/boutique"
              className="border-b border-slate-100 py-3 text-base font-medium text-bibocom-primary"
              onClick={closeMobile}
            >
              Boutiques
            </Link>
            <Link
              to="/stories"
              className="border-b border-slate-100 py-3 text-base font-medium text-bibocom-primary"
              onClick={closeMobile}
            >
              Stories
            </Link>
            <Link
              to="/livraisons"
              className="border-b border-slate-100 py-3 text-base font-medium text-bibocom-primary"
              onClick={closeMobile}
            >
              Livraisons
            </Link>
            <Link
              to="/about"
              className="border-b border-slate-100 py-3 text-base font-medium text-bibocom-primary"
              onClick={closeMobile}
            >
              À propos
            </Link>
            <Link
              to="/contact"
              className="border-b border-slate-100 py-3 text-base font-medium text-bibocom-primary"
              onClick={closeMobile}
            >
              Contact
            </Link>
            </>
            )}
          </nav>
          <div className={cn("mt-6 flex w-full flex-col gap-3", withMenu && !isAuthenticated && "hidden")}>
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={closeMobile}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-bibocom-primary bg-white text-sm font-medium text-bibocom-primary"
                >
                  {displayName || "Mon espace"}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-bibocom-primary text-sm font-medium text-white"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-bibocom-primary bg-white text-sm font-medium text-bibocom-primary transition-colors hover:bg-bibocom-primary/5"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobile}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-bibocom-primary text-sm font-medium text-white transition-colors hover:bg-[#081c30]"
                >
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
          {withMenu ? null : (
          <Link
            to="/cart"
            onClick={closeMobile}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-bibocom-primary"
          >
            <ShoppingCart size={18} />
            Panier
            {itemsCount > 0 ? ` (${itemsCount > 9 ? "9+" : itemsCount})` : ""}
          </Link>
          )}
        </div>
      </div>
      ) : null}
    </>
  );
};

export default Header;
