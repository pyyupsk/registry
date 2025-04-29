import type { ReactNode } from "react";

import { baseOptions } from "@/app/layout.config";
import { generateMetadata } from "@/lib/metadata";
import { HomeLayout } from "fumadocs-ui/layouts/home";

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions}>{children}</HomeLayout>;
}
