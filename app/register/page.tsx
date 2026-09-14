import Register from "@/presentation/pages/Register";
import { pageSeo } from "@/presentation/seo/metadata";

export const metadata = pageSeo.register;

export default function RegisterPage() {
  return <Register />;
}
