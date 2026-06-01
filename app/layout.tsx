import type { Metadata } from 'next'
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ConvexClientProvider } from '@/components/convex-client-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getToken } from '@/lib/auth-server'
import { cn } from '@/lib/utils'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Tascboard',
  description: 'An ERP & Project Mangement App for Organization.',
  icons: {
    icon: '/convex.svg',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const token = await getToken()
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        'font-sans antialiased',
        jetbrainsMono.variable,
        ibmPlexSans.variable,
      )}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider initialToken={token}>
            <NuqsAdapter>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </NuqsAdapter>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
