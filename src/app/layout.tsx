import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Falio Admin Panel",
  description: "Production-grade admin panel for Falio with Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased bg-surface text-foreground">
        {children}
      </body>
    </html>
  );
}
