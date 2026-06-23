'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Home, Building2, BarChart3, Plus,
  ChevronLeft, ChevronRight, Flame, Newspaper,
} from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useApp } from '@/contexts/AppContext'

// useSearchParams requires a Suspense boundary in Next.js 14.
// Pulled into its own component so the outer Sidebar can suspend just this slice.
function NavItems({ sidebarOpen }: { sidebarOpen: boolean }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isHotList = pathname === '/companies' && searchParams.get('hotlist') === '1'

  const items = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      active: pathname === '/',
    },
    {
      href: '/companies?hotlist=1',
      label: 'Hot List',
      icon: Flame,
      active: isHotList,
    },
    {
      href: '/companies',
      label: 'Target List',
      icon: Building2,
      // Active for /companies (without hotlist), /companies/[id], /companies/[id]/edit
      // but NOT /companies/new (has its own item) and NOT when hotlist is active
      active: !isHotList && pathname.startsWith('/companies') && pathname !== '/companies/new',
    },
    {
      href: '/compare',
      label: 'Compare',
      icon: BarChart3,
      active: pathname.startsWith('/compare'),
    },
    {
      href: '/newsletter',
      label: 'Newsletter',
      icon: Newspaper,
      active: pathname.startsWith('/newsletter'),
    },
  ]

  return (
    <nav className="px-2 py-3 space-y-0.5 shrink-0">
      {items.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors duration-[2000ms]',
            active
              ? 'bg-[#A7BDB1] text-[#28282b] border-l-2 border-[#FFA300]'
              : 'text-[#A7BDB1] hover:text-light hover:bg-[#55565c]',
          )}
          title={!sidebarOpen ? label : undefined}
        >
          <Icon size={18} className="shrink-0" />
          {sidebarOpen && <span className="truncate font-medium">{label}</span>}
        </Link>
      ))}

      {/* Add Company — separate so it doesn't get an active state from /companies/* */}
      <Link
        href="/companies/new"
        className={cn(
          'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors duration-[2000ms]',
          pathname === '/companies/new'
            ? 'bg-[#A7BDB1] text-[#28282b] border-l-2 border-[#FFA300]'
            : 'text-[#A7BDB1] hover:text-light hover:bg-[#55565c]',
        )}
        title={!sidebarOpen ? 'Add Company' : undefined}
      >
        <Plus size={18} className="shrink-0" />
        {sidebarOpen && <span className="font-medium">Add Company</span>}
      </Link>
    </nav>
  )
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useApp()

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full bg-sidebar flex flex-col z-30 transition-all duration-[2000ms] ease-in-out border-r border-border',
        sidebarOpen ? 'w-64' : 'w-16',
      )}>
        {/* Logo / brand */}
        <div className="flex items-center h-16 px-3 border-b border-border shrink-0">
          {/* Render logo directly on sidebar bg — mix-blend-mode:screen makes any
              baked-in light background disappear against the dark sidebar. */}
          <Image
            src="/MOAA.png"
            alt="ACC360"
            width={36}
            height={36}
            className="shrink-0 object-contain"
            style={{ mixBlendMode: 'screen' }}
          />
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <p className="font-serif text-sm font-medium text-light leading-none tracking-[0.02em]">
                ACC360
              </p>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto shrink-0 p-1 rounded-md text-muted hover:text-light hover:bg-[#55565c] transition-colors duration-[2000ms]"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Nav — wrapped in Suspense for useSearchParams */}
        <Suspense fallback={<div className="px-2 py-3 space-y-0.5" />}>
          <NavItems sidebarOpen={sidebarOpen} />
        </Suspense>

        {/* Bottom user area */}
        <div className={cn(
          'border-t border-border p-3 shrink-0 flex items-center mt-auto',
          sidebarOpen ? 'gap-3' : 'justify-center',
        )}>
          <UserButton afterSignOutUrl="/sign-in" />
          {sidebarOpen && <p className="text-xs font-light text-muted truncate">ACC Team</p>}
        </div>
      </aside>
    </>
  )
}
