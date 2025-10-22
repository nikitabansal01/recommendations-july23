import type { Metadata } from 'next'
import { Inter, Noto_Serif } from 'next/font/google'
import Image from 'next/image'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const notoSerif = Noto_Serif({ subsets: ['latin'] })

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
        {/* Light header with logo */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderBottom: '1px solid #cbd5e0',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '20px',
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
        </div>
        {/* Add top padding to account for fixed header */}
        <div style={{ paddingTop: '100px' }}>
          {children}
        </div>
      </body>
    </html>
  )
} 