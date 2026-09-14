import { pageSeo } from "@/presentation/seo/metadata";

export const metadata = pageSeo.clientDashboard;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
