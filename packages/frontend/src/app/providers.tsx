import { ThemeProvider } from '@/comps/theme-provider'
import { Toaster } from '@/comps/ui/sonner'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  )
}
