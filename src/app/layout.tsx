import "./globals.css";

import { generateMetadata } from "@/lib/metadata";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "./provider";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = generateMetadata({
  description:
    "A growing collection of beautifully designed, ready-to-use components for your next project.",
  title: "fasu.dev | shadcn/ui components collections.",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
