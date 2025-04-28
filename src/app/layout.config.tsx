import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

import { ThemeSwitcher } from "@/registry/theme-switcher/theme-switcher";
import Image from "next/image";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  githubUrl: "https://github.com/pyyupsk/registry",
  links: [
    {
      active: "nested-url",
      text: "Components",
      url: "/components",
    },
  ],
  nav: {
    title: (
      <>
        <Image
          alt="GitHub's profile image"
          className="rounded-full"
          height="24"
          src="https://github.com/pyyupsk.png"
          width="24"
        />
        <span>
          fasu<span className="text-muted-foreground">.dev</span>
        </span>
      </>
    ),
  },
  themeSwitch: {
    component: (
      <>
        <ThemeSwitcher />
      </>
    ),
  },
};
