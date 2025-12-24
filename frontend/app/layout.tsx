import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navigation } from '@/components'
import { GradientBackground } from '@/components/GradientBackground'

export const metadata: Metadata = {
  title: {
    default: 'Mafia Night',
    template: '%s | Mafia Night',
  },
  description: 'Web application for managing physical Mafia games. Create games, assign roles, and moderate Mafia nights with your friends.',
  keywords: ['mafia', 'mafia game', 'party game', 'social deduction', 'board game', 'role playing'],
  authors: [{ name: 'Mafia Night Team' }],
  creator: 'Mafia Night Team',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : 'http://localhost:3000')
  ),
  openGraph: {
    title: 'Mafia Night',
    description: 'Web application for managing physical Mafia games',
    type: 'website',
    locale: 'en_US',
    siteName: 'Mafia Night',
    images: [
      {
        url: '/mafia_night.png',
        width: 1024,
        height: 1536,
        alt: 'Mafia Night Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mafia Night',
    description: 'Web application for managing physical Mafia games',
    images: ['/mafia_night.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="relative w-full min-h-screen flex flex-col overflow-x-hidden">
        <Navigation />
        <GradientBackground />
        {children}
      </body>
    </html>
  )
}

