import DeliveriesPage from "@/presentation/pages/DeliveriesPage";
import { buildPageMetadata } from "@/presentation/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Livraisons",
  description: "Services de livraison proposés par les fournisseurs BiboMarket.",
  path: "/livraisons",
});

export default function Livraisons() {
  return <DeliveriesPage />;
}
