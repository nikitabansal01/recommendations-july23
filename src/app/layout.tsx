import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Auvra - Decode Your Hormones',
  description: 'Personalized hormone health assessment and recommendations',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/Logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* White header with logo and beta version */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '20px',
          paddingRight: '20px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <Image
              src="/Auvra_Final_Logo 2.png"
              alt="Auvra Logo"
              width={200}
              height={80}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <div style={{
            background: 'rgba(162, 154, 234, 0.1)',
            color: '#2d3748',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            🚧 Beta Version
          </div>
        </div>
        {/* Add top padding to account for fixed header */}
        <div style={{ paddingTop: '100px' }}>
          {children}
        </div>
      </body>
    </html>
  )
} 