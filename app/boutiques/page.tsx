import BoutiquesPage from "@/presentation/pages/BoutiquesPage";
import { pageSeo } from "@/presentation/seo/metadata";

export const metadata = pageSeo.boutiquesList;

export default function Boutiques() {
  return <BoutiquesPage />;
}
