import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "borgboklund.se - Hemdashboard",
  description:
    "Personlig hemdashboard för Borg Boklund med väder, kollektivtrafik, trafikläge och trädgårdsinformation för Norrköping.",
  keywords:
    "borgboklund, norrköping, väder, kollektivtrafik, trafikläge, trädgård, dashboard",
  authors: [{ name: "Boklund Family" }],
  robots: "noindex, nofollow", // Privat hemdashboard
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "borgboklund.se - Hemdashboard",
    description: "Personlig hemdashboard för Borg Boklund",
    type: "website",
    locale: "sv_SE",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
