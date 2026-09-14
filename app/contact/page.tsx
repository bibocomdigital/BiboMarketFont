import ContactPage from "@/presentation/pages/ContactPage";
import { pageSeo } from "@/presentation/seo/metadata";

export const metadata = pageSeo.contact;

export default function Contact() {
  return <ContactPage />;
}
