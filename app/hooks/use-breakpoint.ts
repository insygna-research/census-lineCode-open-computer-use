import * as React from "react"

export function useBreakpoint(breakpoint: number) {
  const [isBelowBreakpoint, setIsBelowBreakpoint] = React.useState<
    boolean | undefined
  >(undefined)
  const [hasMounted, setHasMounted] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => {
      setIsBelowBreakpoint(window.innerWidth < breakpoint)
    }
    mql.addEventListener("change", onChange)
    setIsBelowBreakpoint(window.innerWidth < breakpoint)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  // Return false during SSR to avoid hydration mismatches
  // This assumes desktop-first approach
  if (!hasMounted) {
    return false
  }

  return !!isBelowBreakpoint
}
