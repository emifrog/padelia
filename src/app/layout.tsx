import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister'
import { ToastContainer } from '@/components/ui/Toast'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Padelia — L\'app padel communautaire',
    template: '%s | Padelia',
  },
  description: 'Trouve des partenaires, organise des matchs et suis ta progression. Joue mieux, plus souvent, avec les bons partenaires.',
  keywords: ['padel', 'match', 'partenaire', 'classement', 'sport', 'communauté', 'ELO', 'niveau'],
  authors: [{ name: 'Padelia' }],
  creator: 'Padelia',
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://padelia.app'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Padelia',
    title: 'Padelia — L\'app padel communautaire',
    description: 'Trouve des partenaires, organise des matchs et suis ta progression.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Padelia' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Padelia — L\'app padel communautaire',
    description: 'Trouve des partenaires, organise des matchs et suis ta progression.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Padelia',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1B5E20',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <ToastContainer />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
