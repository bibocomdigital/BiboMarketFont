import ShopsListingPage from "@/presentation/pages/ShopsListingPage";
import { pageSeo } from "@/presentation/seo/metadata";

export const metadata = pageSeo.boutiques;

export default function BoutiqueListing() {
  return <ShopsListingPage />;
}
