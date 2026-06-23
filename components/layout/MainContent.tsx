'use client'

import { useApp } from '@/contexts/AppContext'
import { cn } from '@/lib/utils'
import { TopBar } from './TopBar'

export function MainContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useApp()

  return (
    <div
      className={cn(
        'flex flex-col flex-1 overflow-hidden transition-all duration-[2000ms]',
        // Always offset the collapsed icon bar (w-16); on lg+ also shift when fully open
        sidebarOpen ? 'ml-16 lg:ml-64' : 'ml-16'
      )}
    >
      <TopBar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
    </div>
  )
}
