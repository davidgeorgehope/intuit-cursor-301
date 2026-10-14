import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TurboTax Expert Ops",
    template: "%s · Expert Ops",
  },
  description:
    "Demo console for the Intuit × Cursor 301 session. Tax year 2025, synthetic filers only.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/images/logo-mark.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('expert-ops-theme')==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();",
          }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
