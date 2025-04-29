"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  commands: {
    input: string;
    output?: string | string[];
  }[];
};

const DEFAULT_COMMANDS = [
  {
    input: "npm i motion",
    output: "Installed motion",
  },
  {
    input: "npx shadcn@latest add https://registry.fasu.dev/r/terminal.json",
    output: "Installed terminal",
  },
];

/*
Usage:
<Terminal commands={[
    {
      input: "npm i motion",
      output: "Installed motion",
    },
    {
      input: "npx shadcn@latest add https://registry.fasu.dev/r/terminal.json",
      output: "Installed terminal",
    }
  ]} />
*/
export function Terminal({ commands = DEFAULT_COMMANDS }: Props) {
  const [currentCommandIndex, setCurrentCommandIndex] = useState<number>(0);
  const [displayedInput, setDisplayedInput] = useState<string>("");
  const [displayedOutput, setDisplayedOutput] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState<boolean>(true);

  const currentCommand = useMemo(
    () => commands[currentCommandIndex],
    [commands, currentCommandIndex],
  );

  const typeCommand = useCallback((command: string, callback: () => void) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= command.length) {
        setDisplayedInput(command.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
        callback();
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const typeOutput = useCallback((output: string[], callback: () => void) => {
    let lineIndex = 0;
    let charIndex = 0;
    const interval = setInterval(() => {
      if (lineIndex < output.length) {
        setDisplayedOutput((prev) => {
          const newOutput = [...prev];
          if (output[lineIndex]) {
            newOutput[lineIndex] = output[lineIndex].slice(0, charIndex);
          } else {
            newOutput[lineIndex] = "";
          }
          return newOutput;
        });
        charIndex++;
        if (charIndex > output[lineIndex].length) {
          lineIndex++;
          charIndex = 0;
        }
      } else {
        clearInterval(interval);
        callback();
      }
    }, 25);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentCommand) return;

    const cleanupInput = typeCommand(currentCommand.input, () => {
      setShowCursor(false);
      setTimeout(() => {
        if (currentCommand.output) {
          const outputArray = Array.isArray(currentCommand.output)
            ? currentCommand.output
            : [currentCommand.output];
          const cleanupOutput = typeOutput(outputArray, () => {
            setTimeout(() => {
              setCurrentCommandIndex((prev) => prev + 1);
              setDisplayedInput("");
              setDisplayedOutput([]);
              setShowCursor(true);
            }, 1000);
          });
          return cleanupOutput;
        } else {
          setTimeout(() => {
            setCurrentCommandIndex((prev) => prev + 1);
            setDisplayedInput("");
            setDisplayedOutput([]);
            setShowCursor(true);
          }, 1000);
        }
      }, 500);
    });

    return cleanupInput;
  }, [currentCommand, typeCommand, typeOutput]);

  return (
    <div className="bg-card text-card-foreground aspect-video min-w-[600px] rounded-md border">
      <div className="flex items-center justify-start space-x-2 border-b p-4">
        <div className="size-3 rounded-full bg-red-500"></div>
        <div className="size-3 rounded-full bg-yellow-500"></div>
        <div className="size-3 rounded-full bg-green-500"></div>
      </div>
      <div className="p-4 font-mono text-sm">
        <div>
          {commands.slice(0, currentCommandIndex).map((command, index) => (
            <div className="mb-2" key={index}>
              <div className="flex items-center">
                <span className="mr-2 text-green-500">$</span>
                <span>{command.input}</span>
              </div>
              {command.output && (
                <div className="mt-1 ml-4">
                  {Array.isArray(command.output)
                    ? command.output.map((line, i) => <div key={i}>{line}</div>)
                    : command.output}
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center">
            <span className="mr-2 text-green-500">$</span>
            <motion.span animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
              {displayedInput}
            </motion.span>
            <AnimatePresence>
              {showCursor && (
                <motion.span
                  animate={{ opacity: 1 }}
                  className="ml-1 inline-block h-4 w-2 bg-green-500"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  transition={{
                    duration: 0.7,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              )}
            </AnimatePresence>
          </div>
          <div className="mt-1 ml-4">
            {displayedOutput.map((line, index) => (
              <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} key={index}>
                {line}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
