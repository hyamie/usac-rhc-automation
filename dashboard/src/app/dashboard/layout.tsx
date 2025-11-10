import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Gradient */}
      <header className="border-b bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-900 dark:via-blue-950 dark:to-indigo-950">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                USAC RHC Automation
              </h1>
              <p className="text-sm text-blue-100 dark:text-blue-200">
                Rural Health Care Form 465 Outreach Pipeline
              </p>
            </div>
            <nav className="flex gap-4 items-center">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-white/90 hover:text-white transition-colors px-3 py-2 rounded-md hover:bg-white/10"
              >
                Dashboard
              </Link>
              <div className="h-8 w-px bg-white/20" />
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-sm text-muted-foreground text-center">
            USAC RHC Automation Dashboard - Powered by n8n, Supabase, and Next.js
          </p>
        </div>
      </footer>
    </div>
  )
}
