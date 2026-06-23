'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { Company } from '@/types'

interface AppContextValue {
  /** Whether the left sidebar is expanded */
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  /** Whether the floating AI chat panel is open */
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
  toggleChat: () => void

  /** IDs of companies selected for the compare view */
  compareIds: string[]
  toggleCompare: (id: string) => void
  clearCompare: () => void
  isSelectedForCompare: (id: string) => boolean

  /** All companies, fetched once on app load */
  allCompanies: Company[]
  companiesReady: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [companiesReady, setCompaniesReady] = useState(false)

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: Company[]) => setAllCompanies(data))
      .catch(() => {})
      .finally(() => setCompaniesReady(true))
  }, [])

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), [])
  const toggleChat = useCallback(() => setChatOpen((v) => !v), [])

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id)
      if (prev.length >= 3) return prev // max 3
      return [...prev, id]
    })
  }, [])

  const clearCompare = useCallback(() => setCompareIds([]), [])

  const isSelectedForCompare = useCallback(
    (id: string) => compareIds.includes(id),
    [compareIds]
  )

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        chatOpen,
        setChatOpen,
        toggleChat,
        compareIds,
        toggleCompare,
        clearCompare,
        isSelectedForCompare,
        allCompanies,
        companiesReady,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
