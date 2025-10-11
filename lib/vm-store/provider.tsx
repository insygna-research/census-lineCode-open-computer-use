"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface VMStoreContextType {
  selectedVMId: string | null
  setSelectedVMId: (vmId: string | null) => void
}

const VMStoreContext = createContext<VMStoreContextType | undefined>(undefined)

export function VMStoreProvider({ children }: { children: ReactNode }) {
  const [selectedVMId, setSelectedVMId] = useState<string | null>(null)

  return (
    <VMStoreContext.Provider value={{ selectedVMId, setSelectedVMId }}>
      {children}
    </VMStoreContext.Provider>
  )
}

export function useVMStore() {
  const context = useContext(VMStoreContext)
  if (!context) {
    throw new Error("useVMStore must be used within a VMStoreProvider")
  }
  return context
}