import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: { default: 'BarterWithMe', template: '%s | BarterWithMe' },
  description: 'Trade goods and services directly with people in your community — no money, no middlemen.',
  metadataBase: new URL('https://barterwithme.org'),
  openGraph: {
    siteName: 'BarterWithMe',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-400">
          <p>
            BarterWithMe is community-owned and open source.{' '}
            <a href="/why" className="underline hover:text-stone-600">Why this exists →</a>
          </p>
        </footer>
      </body>
    </html>
  )
}
