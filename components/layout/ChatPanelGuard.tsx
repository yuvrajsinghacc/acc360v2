'use client'

import { usePathname } from 'next/navigation'
import { ChatPanel } from './ChatPanel'

export function ChatPanelGuard() {
  const pathname = usePathname()
  if (pathname === '/') return null
  return <ChatPanel />
}
