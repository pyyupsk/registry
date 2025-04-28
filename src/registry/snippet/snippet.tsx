"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import { memo, useCallback, useState } from "react";

export const Snippet = memo(({ className, command }: { className?: string; command: string }) => {
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
      className={cn("bg-background relative flex items-center rounded-md border p-2", className)}
    >
      <pre className="mr-8 max-w-full overflow-x-auto font-mono text-sm before:content-['$_'] before:select-none">
        <code>{command}</code>
      </pre>
      <button
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        className="absolute top-1/2 right-4 flex -translate-y-1/2 items-center justify-center"
        onClick={handleCopy}
      >
        <CheckIcon
          className={cn(
            "absolute h-4 w-4 transition-all",
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
