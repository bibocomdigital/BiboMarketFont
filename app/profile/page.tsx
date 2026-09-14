"use client";

import { clientOnly } from "@/presentation/lib/dynamic-page";

const Profile = clientOnly(() => import("@/presentation/pages/Profile"));

export default function ProfilePage() {
  return <Profile />;
}
