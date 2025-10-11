/**
 * Centralized theme configuration for gradients and colors
 * Change these values to update the theme throughout the app
 */

export const themeConfig = {
  // Primary accent color used throughout the app
  primary: {
    // Main blue color - change this to update the primary color
    base: "rgb(59, 130, 246)", // blue-600
    light: "rgb(147, 197, 253)", // blue-300
    dark: "rgb(37, 99, 235)", // blue-700
    
    // Tailwind classes
    tw: {
      base: "blue-600",
      light: "blue-400",
      dark: "blue-500",
      border: "blue-500/20",
      bg: {
        subtle: "blue-500/5",
        medium: "blue-500/10",
        strong: "blue-500/20"
      },
      text: {
        base: "text-blue-600 dark:text-blue-400",
        light: "text-blue-400",
        dark: "text-blue-700"
      }
    }
  },
  
  // Secondary colors for gradients
  secondary: {
    blue: "rgb(59, 130, 246)", // blue-600
    pink: "rgb(236, 72, 153)", // pink-500
    violet: "rgb(139, 92, 246)" // violet-500
  },
  
  // Gradient configurations
  gradients: {
    // Main background gradient in GradientBackground component
    background: {
      // Smoke gradient colors and opacities - More vibrant and pronounced
      smoke1: {
        color: "rgb(0, 122, 255)", // Bright electric blue
        opacities: ["0.65", "0.45", "0"] // Much stronger presence
      },
      smoke2: {
        color: "rgb(255, 20, 147)", // Bright hot pink
        opacities: ["0.60", "0.40", "0"] // Stronger presence
      },
      smoke3: {
        color: "rgb(147, 51, 234)", // Bright purple
        opacities: ["0.55", "0.35", "0"] // Stronger presence
      },
      smoke4: {
        color: "rgb(0, 255, 204)", // Bright cyan/aqua
        opacities: ["0.60", "0.40", "0"] // Stronger presence
      },
      smoke5: {
        color: "rgb(255, 123, 0)", // Bright orange
        opacities: ["0.55", "0.35", "0"] // Stronger presence
      },
      // Base gradients - more vibrant and visible
      base: {
        from: "blue-600/[0.15]", // Stronger base
        via: "purple-500/[0.12]", // More visible mid-tone
        to: "transparent"
      },
      radial: "rgba(147,51,234,0.25)", // Stronger purple glow
      blur: {
        from: "blue-500/[0.12]", // Stronger blue
        via: "pink-500/[0.10]", // More vibrant colors
        to: "cyan-400/[0.08]" // Stronger fade with cyan
      },
      // Mobile simplified gradients - much more vibrant
      mobile: {
        base: "from-blue-600/[0.20] via-cyan-500/[0.15] to-transparent", // Much more visible
        radial: "rgba(0,255,204,0.30)" // Much stronger cyan glow on mobile
      }
    },
    
    // Word rotation animation gradient in chat.tsx
    wordRotation: {
      base: "from-blue-500/5 via-pink-500/10 to-blue-500/5",
      border: "border-blue-500/20",
      radialGlow: "rgba(59, 130, 246, 0.05)"
    },
    
    // Other UI gradients
    ui: {
      button: "from-purple-600 to-purple-700",
      hover: "from-purple-500 to-purple-600",
      badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-400"
    }
  }
}

// Helper function to get CSS variable for dynamic theming
export function getCSSVariable(variableName: string): string {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim()
  }
  return ''
}

// Helper to generate gradient string
export function generateGradient(from: string, via?: string, to?: string, direction: string = 'to-r'): string {
  if (via) {
    return `bg-gradient-${direction} from-${from} via-${via} to-${to}`
  }
  return `bg-gradient-${direction} from-${from} to-${to}`
}