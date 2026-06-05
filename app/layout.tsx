import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Castles & Palaces of Europe — Discover 500+ Historic Sites",
    template: "%s — Castles & Palaces",
  },
  description:
    'Explore the most beautiful castles and palaces in Europe. Visitor guides, tours, tickets and itineraries for France, Germany, Scotland, Spain and more.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castlespalaces.com'),
  verification: {
    google: 'jA2ee_QwF3XrmJ8sTKverxCBHqAOcOgxlIEL0WrlksA',
  },
  openGraph: {
    siteName: 'Castles & Palaces',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-[#fafaf8] text-[#1a1a1a] font-sans min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
