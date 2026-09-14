import Index from "@/presentation/pages/Index";
import { pageSeo } from "@/presentation/seo/metadata";

export const metadata = pageSeo.home;

export default function HomePage() {
  return <Index />;
}
