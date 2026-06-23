import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'ACC Intelligence',
  description: 'Internal company intelligence platform for The Acceleration Company',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInForceRedirectUrl="/" signUpForceRedirectUrl="/">
      <html lang="en" suppressHydrationWarning>
        <body>
          {children}
          <Toaster
            position="top-right"
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1F2937',
                color: '#E5E7EB',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#8FB5A8', secondary: '#1F2937' } },
              error:   { iconTheme: { primary: '#EF4444', secondary: '#1F2937' } },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
