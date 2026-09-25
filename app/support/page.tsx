import { SupportAssistant } from "@/presentation/components/support/SupportAssistant";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { buildPageMetadata } from "@/presentation/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Support",
  description: "Ouvrez un ticket auprès de l’équipe Bibocom Market.",
  path: "/support",
});

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-bibocom-light pt-20 md:pt-24">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <SupportAssistant />
      </main>
      <Footer />
    </div>
  );
}
