import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <section className="container flex h-[calc(100vh-4rem)] flex-col-reverse items-center justify-center gap-8 sm:flex-row sm:justify-between">
      <div className="sm:w-1/2">
        <h1 className="mb-6 text-center text-5xl font-bold tracking-tight sm:text-left">
          fasu<span className="text-muted-foreground">.dev</span> shadcn/ui components collections
        </h1>
        <p className="text-muted-foreground mb-8 text-center text-lg sm:text-left">
          A growing collection of beautifully designed, ready-to-use components for your next
          project.
        </p>
        <div className="flex flex-row items-center justify-center gap-4 sm:justify-start">
          <Link
            className={buttonVariants({ size: "lg" })}
            href="/components"
            title="Browse Components"
          >
            Browse Components
            <ArrowRight />
          </Link>
          <Link
            className={buttonVariants({ size: "lg", variant: "outline" })}
            href="https://github.com/pyyupsk/registry"
            target="_blank"
            title="GitHub"
          >
            <Github />
            GitHub Repository
          </Link>
        </div>
      </div>

      <div className="flex w-1/2 items-center justify-center sm:justify-end">
        <Image
          alt="fasu.dev"
          className="relative z-10 aspect-square w-4/5 rounded-2xl object-cover"
          height={550}
          src="https://github.com/pyyupsk.png"
          width={550}
        />
      </div>
    </section>
  );
}
