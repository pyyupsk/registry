import type { DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";

import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";

const options = {
  ...baseOptions,
  links: undefined,
  tree: source.pageTree,
} satisfies DocsLayoutProps;

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayout {...options}>{children}</DocsLayout>;
}
