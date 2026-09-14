import Login from "@/presentation/pages/Login";
import { pageSeo } from "@/presentation/seo/metadata";

export const metadata = pageSeo.login;

export default function LoginPage() {
  return <Login />;
}
