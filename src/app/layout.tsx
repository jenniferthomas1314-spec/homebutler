// src/app/layout.tsx
import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'HomeButler — Your home, perfectly managed',
  description:
    'Smart home maintenance tracking, document vault, property timeline, and home sale transfer — all in one place.',
  keywords: ['home maintenance', 'home management', 'property tracker', 'document vault'],
  openGraph: {
    title: 'HomeButler',
    description: 'Your home, perfectly managed.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="bg-bg text-dark font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '13px',
              borderRadius: '10px',
              background: '#1a1a18',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
