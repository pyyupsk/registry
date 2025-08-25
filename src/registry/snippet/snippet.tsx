"use client";

import type { HTMLAttributes } from "react";

import { CheckIcon, CopyIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";

import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLDivElement> & {
  command: string;
};

const DEFAULT_COMMAND = "bunx --bun shadcn@latest add https://registry.fasu.dev/r/snippet.json";

/*
Usage:
<Snippet command="bunx --bun shadcn@latest add https://registry.fasu.dev/r/snippet.json" />
*/
export const Snippet = memo(({ command = DEFAULT_COMMAND, ...props }: Props) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text: ", error);
    }
  }, [command]);

  return (
    <div
      className={cn(
        "bg-background relative flex items-center rounded-md border p-2",
        props.className,
      )}
      {...props}
    >
      <pre className="mr-8 max-w-full overflow-x-auto font-mono text-sm before:content-['$_'] before:select-none">
        <code className="not-prose">{command}</code>
      </pre>
      <button
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        className="absolute top-1/2 right-4 flex -translate-y-1/2 cursor-pointer items-center justify-center"
        onClick={handleCopy}
      >
        <CheckIcon
          className={cn(
            "absolute h-4 w-4 text-green-500 transition-all",
            copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
          )}
        />
        <CopyIcon
          className={cn(
            "absolute h-4 w-4 transition-all",
            copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
          )}
        />
        <span className="sr-only">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
});

Snippet.displayName = "Snippet";
