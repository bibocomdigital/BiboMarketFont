import { pageSeo } from "@/presentation/seo/metadata";

export const metadata = pageSeo.adminDashboard;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
