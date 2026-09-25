import React from "react";
import { Store, ShoppingBag, Users } from "lucide-react";
import CreateShopDialog from "./CreateShopDialog";

interface NoShopProps {
  onShopCreated: () => void;
}

const STEPS = [
  {
    title: "Créez la boutique",
    text: "Nom, description et logo. Une seule boutique par compte.",
    icon: Store,
  },
  {
    title: "Ajoutez vos produits",
    text: "Photos, prix et stock, comme dans votre boutique physique.",
    icon: ShoppingBag,
  },
  {
    title: "Recevez les commandes",
    text: "Suivez les ventes, le comptoir et les messages clients.",
    icon: Users,
  },
];

const NoShop: React.FC<NoShopProps> = ({ onShopCreated }) => {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="grid gap-8 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bibocom-accent">
              Première étape
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-bibocom-primary md:text-3xl">
              Ouvrez votre boutique
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Votre espace est prêt. Créez la boutique pour publier vos produits, suivre le stock et recevoir les commandes.
            </p>
            <div className="mt-6">
              <CreateShopDialog onSuccess={onShopCreated} />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Un commerçant ne crée qu’une boutique. Vous pourrez ensuite modifier son nom, son logo et ses produits.
            </p>
          </div>
          <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-bibocom-primary to-[#16375c] p-8 text-white">
            <div className="text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <Store className="h-8 w-8" />
              </span>
              <p className="mt-4 text-lg font-semibold">Bibocom Market</p>
              <p className="mt-1 text-sm text-white/70">Votre vitrine en ligne</p>
            </div>
          </div>
        </div>
      </section>

      <ol className="grid gap-3 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bibocom-primary/10 text-sm font-semibold text-bibocom-primary">
                {index + 1}
              </span>
              <step.icon className="h-4 w-4 text-bibocom-accent" />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-bibocom-primary">{step.title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default NoShop;
