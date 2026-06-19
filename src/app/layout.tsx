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
        <footer className="border-t border-stone-200 py-8 text-center text-xs text-stone-400">
          <p className="mb-2 font-medium text-stone-500">BarterWithMe</p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mb-3">
            <a href="/why" className="hover:text-stone-600 hover:underline">Why this exists</a>
            <a href="/safety" className="hover:text-stone-600 hover:underline">Safety tips</a>
            <a href="/community-guidelines" className="hover:text-stone-600 hover:underline">Guidelines</a>
            <a href="/terms" className="hover:text-stone-600 hover:underline">Terms of Service</a>
            <a href="/donate" className="hover:text-stone-600 hover:underline">Support the project</a>
          </nav>
          <p>Community-owned · Open source · No ads · No data sales</p>
        </footer>
      </body>
    </html>
  )
}
