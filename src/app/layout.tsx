import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister';
import InstallPrompt from '@/components/layout/InstallPrompt';
import './globals.css';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

export const metadata: Metadata = {
  title: {
    default: 'Padelia',
    template: '%s | Padelia',
  },
  description: 'Joue mieux, plus souvent, avec les bons partenaires.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Padelia',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0B1A2E',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${outfit.variable} antialiased`}
        style={{ fontFamily: 'var(--font-outfit), system-ui, sans-serif' }}
      >
        {children}
        <Toaster position="top-center" richColors />
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
