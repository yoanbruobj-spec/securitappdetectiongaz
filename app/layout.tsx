import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
