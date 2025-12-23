import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "English AI - Writing Practice",
  description: "AI-powered English writing practice application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
