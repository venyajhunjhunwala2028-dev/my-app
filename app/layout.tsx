import type { Metadata, Viewport } from "next";
import { Fredoka, Inter, Inter_Tight } from "next/font/google";
import AppPreferences from "@/components/AppPreferences";
import { PREFERENCES_SCRIPT } from "@/lib/textSize";
import "./globals.css";

// Self-hosted by next/font. globals.css reads the variables: Inter for text, Inter Tight for headlines,
// and Fredoka (rounded, bold) for the wordmark only.
const inter = Inter({ subsets: ["latin"], variable: "--nf-inter", display: "swap" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--nf-inter-tight", display: "swap" });
const fredoka = Fredoka({ subsets: ["latin"], weight: "600", variable: "--nf-brand", display: "swap" });

export const metadata: Metadata = {
  title: "Tech Helper",
  description:
    "Ask any question about phones, computers, apps or AI and get simple steps, one at a time.",
  appleWebApp: { capable: true, title: "Tech Helper", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script sets data-text-size and data-easy before React hydrates, so <html> may differ from the server's.
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${fredoka.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFERENCES_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppPreferences />
        {children}
      </body>
    </html>
  );
}
