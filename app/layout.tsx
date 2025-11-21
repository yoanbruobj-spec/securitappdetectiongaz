import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/design-system/useTheme";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/ui/CommandPalette";

export const metadata: Metadata = {
  title: "SÉCUR'IT - Gestion d'interventions",
  description: "Application professionnelle de gestion d'interventions détection gaz et sécurité incendie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans">
        <ThemeProvider>
          <ToastProvider>
            <CommandPalette />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
