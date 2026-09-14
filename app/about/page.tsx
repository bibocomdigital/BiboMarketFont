import AboutPage from "@/presentation/pages/AboutPage";
import { pageSeo } from "@/presentation/seo/metadata";

export const metadata = pageSeo.about;

export default function About() {
  return <AboutPage />;
}
