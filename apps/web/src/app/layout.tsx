import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AfricanMarkets — Live GSE & NGX Data",
    template: "%s | AfricanMarkets",
  },
  description:
    "Real-time Ghana and Nigerian stock market data for developers and investors. Free, normalized, API-ready.",
  keywords: [
    "Ghana Stock Exchange",
    "Nigerian Exchange",
    "GSE",
    "NGX",
    "African markets",
    "stock market data",
    "financial API",
  ],
  authors: [{ name: "AfricanMarkets" }],
  creator: "AfricanMarkets",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://african-markets.vercel.app",
    siteName: "AfricanMarkets",
    title: "AfricanMarkets — Live GSE & NGX Data",
    description:
      "Real-time Ghana and Nigerian stock market data. Free REST API for developers.",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "AfricanMarkets",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "AfricanMarkets — Live GSE & NGX Data",
    description: "Real-time Ghana and Nigerian stock market data. Free REST API.",
    images: ["/logo.svg"],
  },
  metadataBase: new URL("https://african-markets.vercel.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}