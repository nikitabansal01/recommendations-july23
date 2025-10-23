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
      <body className={inter.className} style={{
        background: 'linear-gradient(135deg, #A29AEA 0%, #C17EC9 25%, #D482B9 50%, #E98BAC 75%, #FDC6D1 100%)',
        minHeight: '100vh'
      }}>
        {/* Glassmorphism header with logo and beta version */}
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '15px',
          right: '15px',
          height: '60px',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          alignContent: 'center',
          paddingLeft: '20px',
          paddingRight: '20px',
          paddingTop: '8px',
          paddingBottom: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: '20px'
        }}>
          <div style={{
            padding: '8px', display: 'flex'
          }}>
            <Image
              src="/Auvra_Final_Logo 2.png"
              alt="Auvra Logo"
              width={200}
              height={45}
              style={{ 
                width: 'auto', 
                height: '45px', 
                objectFit: 'contain',
                maxWidth: '100%'
              }}
            />
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#2d3748',
            padding: '8px 16px',
            borderRadius: '25px',
            fontSize: '0.8rem',
            fontWeight: '600',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            🚧 Beta Version
          </div>
        </div>
        {/* Add top padding to account for fixed header */}
        <div style={{ paddingTop: '90px' }}>
          {children}
        </div>
      </body>
    </html>
  )
} 