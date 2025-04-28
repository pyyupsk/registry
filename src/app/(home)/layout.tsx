import type { ReactNode } from "react";

import { baseOptions } from "@/app/layout.config";
import { generateMetadata } from "@/lib/metadata";
import { HomeLayout } from "fumadocs-ui/layouts/home";

export const metadata = generateMetadata({
  description:
    "A growing collection of beautifully designed, ready-to-use components for your next project.",
  title: "fasu.dev | shadcn/ui components collections.",
});

export default function Layout({ children }: { children: ReactNode }) {
  return <HomeLayout {...baseOptions}>{children}</HomeLayout>;
}
