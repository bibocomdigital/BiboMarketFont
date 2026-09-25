import StoriesPage from "@/presentation/pages/StoriesPage";
import { buildPageMetadata } from "@/presentation/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Stories",
  description: "Stories photo et vidéo des commerçants et fournisseurs badgeés sur BiboMarket.",
  path: "/stories",
});

export default function Stories() {
  return <StoriesPage />;
}
