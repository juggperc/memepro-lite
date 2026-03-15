import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: "memepro.lite | Solana Trading & P2P Gaming",
  description: "High-performance Solana dashboard for pump.fun tokens with integrated P2P gaming.",
  keywords: "solana, memecoin, pump.fun, crypto casino, p2p betting, provably fair",
  authors: [{ name: "memepro.lite" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "memepro.lite | Solana Trading & P2P Gaming",
    description: "High-performance Solana dashboard for pump.fun tokens.",
    type: "website",
    siteName: "memepro.lite",
  },
  twitter: {
    card: "summary_large_image",
    title: "memepro.lite | Solana Trading & P2P Gaming",
    description: "High-performance Solana dashboard for pump.fun tokens.",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-black text-white`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
