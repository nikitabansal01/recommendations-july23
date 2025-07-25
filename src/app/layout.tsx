import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hormone Health Assessment',
  description: 'Personalized hormone health assessment and recommendations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Fixed logo at top-left - same as Rootcause project */}
        <div style={{
          position: 'absolute',
          left: '16px',
          top: '16px',
          width: '60px',
          height: '60px',
          zIndex: 1000
        }}>
          <Image 
            src="/Logo.png" 
            alt="Logo" 
            width={60} 
            height={60}
            style={{ objectFit: 'contain' }}
          />
        </div>
        {children}
      </body>
    </html>
  )
} 