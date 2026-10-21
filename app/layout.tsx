// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientProviders from "../components/provider/ClientProviders";

export const metadata: Metadata = {
  title: "MediCarePLC Admin Dashboard",
  description: "Modern admin dashboard for managing your business",
  applicationName: "MediCarePLC Admin Dashboard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MediCarePLC",
  },
  icons: {
    apple: "/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F9FAFB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
