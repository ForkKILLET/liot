import { ThemeProvider } from '@/comps/theme-provider'
import { Toaster } from '@/comps/ui/sonner'
import NextTopLoader from 'nextjs-toploader'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <NextTopLoader
        color='var(--primary)'
        height={3}
        showSpinner={false}
        crawl
        crawlSpeed={160}
        speed={220}
        easing='ease'
        shadow={false}
      />
      {children}
      <Toaster />
    </ThemeProvider>
  )
}
