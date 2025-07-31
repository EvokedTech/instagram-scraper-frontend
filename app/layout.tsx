import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NotificationContainer from '@/components/NotificationContainer'
import ErrorBoundary from '@/components/ErrorBoundary'
import ClientOnly from '@/components/ClientOnly'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Instagram Scraper Dashboard',
  description: 'Manage Instagram profile scraping sessions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
          <ClientOnly>
            <NotificationContainer />
          </ClientOnly>
        </ErrorBoundary>
      </body>
    </html>
  )
}