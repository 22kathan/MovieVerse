import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import SessionProvider from "@/components/shared/SessionProvider";
import { ToastProvider } from "@/components/shared/Toast";
import SpaRouteRestorer from "@/components/shared/SpaRouteRestorer";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MovieVerse — Discover Movies, TV Shows & More",
    template: "%s | MovieVerse",
  },
  description:
    "The ultimate movie and TV show database. Browse ratings, reviews, trailers, cast info, and discover where to stream. Powered by AI recommendations.",
  keywords: [
    "movies",
    "TV shows",
    "ratings",
    "reviews",
    "trailers",
    "IMDb alternative",
    "streaming",
    "watchlist",
  ],
  openGraph: {
    title: "MovieVerse — Discover Movies, TV Shows & More",
    description:
      "The ultimate movie and TV show database with AI-powered recommendations.",
    type: "website",
    locale: "en_US",
    siteName: "MovieVerse",
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieVerse",
    description: "Discover Movies, TV Shows & More",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable}`}
      data-theme="dark"
    >
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        <SessionProvider>
          <ToastProvider>
            <SpaRouteRestorer />
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex flex-1 flex-col md:ml-[260px]">
                <Header />
                <main className="flex-1 pt-[64px]">{children}</main>
              </div>
            </div>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
