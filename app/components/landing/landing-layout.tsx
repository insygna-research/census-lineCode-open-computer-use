"use client"

import { ReactNode } from "react"

export function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  )
}