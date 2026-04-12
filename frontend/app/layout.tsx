import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kairos — Fintech Observability",
  description:
    "Real-time AI-powered SLA monitoring for cloud-native fintech infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-s-bg text-s-text font-mono antialiased">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
