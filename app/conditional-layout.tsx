import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { ReactNode } from "react"

export function ConditionalLayout({ 
  children, 
  needsSidebar 
}: { 
  children: ReactNode
  needsSidebar: boolean 
}) {
  if (!needsSidebar) {
    // For landing page, render without SidebarProvider
    return (
      <>
        <Toaster position="top-center" />
        {children}
      </>
    )
  }

  // For authenticated app, render with SidebarProvider
  return (
    <SidebarProvider defaultOpen={false}>
      <Toaster position="top-center" />
      {children}
    </SidebarProvider>
  )
}