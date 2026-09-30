import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { inter, spaceGrotesk } from './fonts'

export const metadata: Metadata = {
  title: 'ExamLogic',
  description: 'JAMB exam prep that feels like a game',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
