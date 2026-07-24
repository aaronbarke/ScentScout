import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
/** Editorial display serif — the visual signature of fragrance retail. */
const displaySerif = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ScentScout — find the exact fragrance, at the best delivered price",
    template: "%s · ScentScout",
  },
  description:
    "Compare exact fragrance variants across retailers by estimated delivered price, delivery speed, and price history — with honest buy-now guidance.",
  openGraph: {
    title: "ScentScout",
    description: "Exact-variant fragrance price comparison with delivered-price and buy-now guidance.",
    url: SITE_URL,
    siteName: "ScentScout",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displaySerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-body">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-14">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-8 text-xs text-faint">
            <p>
              ScentScout compares exact fragrance variants. Prices are estimates before tax and may
              be out of date — always confirm at checkout.
            </p>
            <p>
              Some links may be affiliate links.{" "}
              <Link href="/" className="underline hover:text-body">
                ScentScout
              </Link>{" "}
              · MVP
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
