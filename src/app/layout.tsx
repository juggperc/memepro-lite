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
  title: "meme.pro | Solana Trading & P2P Gaming",
  description: "Real-time Solana memecoin analysis with pump.fun integration. Peer-to-peer crypto gaming with provably fair outcomes. No house edge - bet against real players.",
  keywords: "solana, memecoin, pump.fun, crypto casino, p2p betting, provably fair, coinflip, dice",
  authors: [{ name: "meme.pro" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "meme.pro | Solana Trading & P2P Gaming",
    description: "Real-time Solana analysis and provably fair P2P crypto gaming",
    type: "website",
    siteName: "meme.pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "meme.pro | Solana Trading & P2P Gaming",
    description: "Real-time Solana analysis and provably fair P2P crypto gaming",
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
