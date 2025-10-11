"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

interface RainbowButtonProps {
  className?: string
  onClick?: () => void
}

export function RainbowButton({ className, onClick }: RainbowButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "relative overflow-hidden h-8 px-3 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-105",
        className
      )}
      onClick={onClick}
    >
      {/* Bright glow effect */}
      <motion.div
        className="absolute inset-0 opacity-90"
        style={{
          background: "conic-gradient(from 0deg at 50% 50%, #ff006e, #ff4500, #ffb700, #00ff88, #00d4ff, #5e17eb, #ff006e)",
          filter: "blur(4px) brightness(1.2)",
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <motion.div
        className="absolute inset-0 opacity-70"
        style={{
          background: "conic-gradient(from 180deg at 50% 50%, #00ffff, #ff00ff, #ffff00, #00ffff)",
          filter: "blur(8px) brightness(1.3)",
        }}
        animate={{
          rotate: [360, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 30% 50%, rgba(255,0,150,0.5), transparent 40%), radial-gradient(circle at 70% 50%, rgba(0,200,255,0.5), transparent 40%)",
          filter: "blur(3px)",
        }}
        animate={{
          x: ["0%", "10%", "-10%", "0%"],
          y: ["0%", "-10%", "10%", "0%"],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Subtle inner glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2), transparent 70%)",
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute inset-[1px] bg-background/70 dark:bg-card/70 backdrop-blur-sm rounded-3xl"
        animate={{
          opacity: [0.75, 0.65, 0.75],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <span className="relative text-sm font-semibold text-foreground dark:text-white drop-shadow-sm">Guide</span>
    </Button>
  )
}