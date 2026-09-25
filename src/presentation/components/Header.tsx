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
  const activeCategoryId = new URLSearchParams(location.search).get("categorieShopId");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 items-center">
              <Link to="/" className="flex items-center">
                <span className="text-lg font-bold tracking-tight text-bibocom-primary sm:text-xl">
                  BIBOCOM<span className="text-bibocom-accent">MARKET</span>
                </span>
              </Link>
            </div>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1">
              <Link to="/" className={navClass("/", true)}>
                Accueil
              </Link>

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
            </nav>

            <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-3">
              <button
                type="button"
                className="text-bibocom-primary hover:text-bibocom-accent transition-colors duration-300"
                aria-label="Rechercher"
              >
                <Search size={20} />
              </button>
              <Link
                to="/cart"
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
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={displayName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bibocom-primary/10 text-bibocom-primary">
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
              ) : (
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

            <div className="flex items-center lg:hidden">
              <button
                type="button"
                className="p-2 text-bibocom-primary"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={isMobileMenuOpen}
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[60] overflow-y-auto bg-bibocom-light lg:hidden",
          "transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex h-full flex-col overflow-y-auto px-6 pt-6">
          <div className="mb-8 flex items-center justify-between">
            <span className="text-xl font-bold text-bibocom-primary">
              BIBOCOM<span className="text-bibocom-accent">MARKET</span>
            </span>
            <button
              type="button"
              className="rounded-lg p-2 text-bibocom-primary"
              onClick={closeMobile}
              aria-label="Fermer le menu"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="flex flex-col space-y-6">
            {isAuthenticated && (
              <Link
                to={dashboardPath}
                className="text-bibocom-primary hover:text-bibocom-accent text-lg font-medium"
                onClick={closeMobile}
              >
                Tableau de bord
              </Link>
            )}
            <Link
              to="/"
              className="text-bibocom-primary hover:text-bibocom-accent text-lg font-medium"
              onClick={closeMobile}
            >
              Accueil
            </Link>
            <div>
              <button
                type="button"
                className="flex w-full items-center justify-between text-lg font-medium text-bibocom-primary"
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
            <Link
              to="/boutique"
              className="text-bibocom-primary hover:text-bibocom-accent text-lg font-medium"
              onClick={closeMobile}
            >
              Boutiques
            </Link>
            <Link
              to="/stories"
              className="text-bibocom-primary hover:text-bibocom-accent text-lg font-medium"
              onClick={closeMobile}
            >
              Stories
            </Link>
            <Link
              to="/livraisons"
              className="text-bibocom-primary hover:text-bibocom-accent text-lg font-medium"
              onClick={closeMobile}
            >
              Livraisons
            </Link>
            <Link
              to="/about"
              className="text-bibocom-primary hover:text-bibocom-accent text-lg font-medium"
              onClick={closeMobile}
            >
              À propos
            </Link>
            <Link
              to="/contact"
              className="text-bibocom-primary hover:text-bibocom-accent text-lg font-medium"
              onClick={closeMobile}
            >
              Contact
            </Link>
          </nav>
          <div className="mt-8 flex w-full flex-col gap-3">
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
          <div className="mt-auto mb-10 flex items-center justify-center space-x-6">
            <button
              type="button"
              className="text-bibocom-primary hover:text-bibocom-accent transition-colors duration-300"
            >
              <Search size={24} />
            </button>
            <Link
              to="/cart"
              onClick={closeMobile}
              className="text-bibocom-primary hover:text-bibocom-accent transition-colors duration-300 relative"
            >
              <ShoppingCart size={24} />
              {itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-bibocom-accent text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {itemsCount > 9 ? "9+" : itemsCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
