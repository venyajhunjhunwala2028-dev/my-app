import type { Metadata, Viewport } from "next";
import AppPreferences from "@/components/AppPreferences";
import { TEXT_SIZE_SCRIPT } from "@/lib/textSize";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Helper",
  description:
    "Ask any question about phones, computers, apps or AI and get simple steps, one at a time.",
  appleWebApp: { capable: true, title: "Tech Helper", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf9f6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script sets data-text-size before React hydrates, so <html> may differ from the server's.
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEXT_SIZE_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppPreferences />
        {children}
      </body>
    </html>
  );
}
