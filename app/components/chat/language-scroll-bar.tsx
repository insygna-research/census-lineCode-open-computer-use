"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const languages = [
  { code: "EN", name: "English" },
  { code: "ZH", name: "中文" },
  { code: "HI", name: "हिंदी" },
  { code: "ES", name: "Español" },
  { code: "AR", name: "العربية" },
  { code: "BN", name: "বাংলা" },
  { code: "PT", name: "Português" },
  { code: "RU", name: "Русский" },
  { code: "JA", name: "日本語" },
  { code: "PA", name: "ਪੰਜਾਬੀ" },
  { code: "DE", name: "Deutsch" },
  { code: "JV", name: "Basa Jawa" },
  { code: "KO", name: "한국어" },
  { code: "FR", name: "Français" },
  { code: "TE", name: "తెలుగు" },
  { code: "MR", name: "मराठी" },
  { code: "TR", name: "Türkçe" },
  { code: "TA", name: "தமிழ்" },
  { code: "VI", name: "Tiếng Việt" },
  { code: "UR", name: "اردو" },
  { code: "IT", name: "Italiano" },
  { code: "TH", name: "ไทย" },
  { code: "GU", name: "ગુજરાતી" },
  { code: "PL", name: "Polski" },
  { code: "UK", name: "Українська" },
  { code: "ML", name: "മലയാളം" },
  { code: "KN", name: "ಕನ್ನಡ" },
  { code: "MY", name: "မြန်မာ" },
  { code: "SW", name: "Kiswahili" },
  { code: "AM", name: "አማርኛ" },
  { code: "HA", name: "Hausa" },
  { code: "YO", name: "Yorùbá" },
  { code: "IG", name: "Igbo" },
  { code: "NL", name: "Nederlands" },
  { code: "RO", name: "Română" },
  { code: "HU", name: "Magyar" },
  { code: "CS", name: "Čeština" },
  { code: "EL", name: "Ελληνικά" },
  { code: "BG", name: "Български" },
  { code: "HR", name: "Hrvatski" },
  { code: "SK", name: "Slovenčina" },
  { code: "SL", name: "Slovenščina" },
  { code: "LV", name: "Latviešu" },
  { code: "LT", name: "Lietuvių" },
  { code: "ET", name: "Eesti" },
  { code: "FI", name: "Suomi" },
  { code: "DA", name: "Dansk" },
  { code: "SV", name: "Svenska" },
  { code: "NO", name: "Norsk" },
  { code: "IS", name: "Íslenska" },
]

interface LanguageScrollBarProps {
  className?: string
  variant?: "default" | "compact"
}

export function LanguageScrollBar({ 
  className, 
  variant = "default" 
}: LanguageScrollBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-2 p-1">
          {languages.map((language, index) => (
            <motion.div
              key={language.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.02,
                ease: "easeOut"
              }}
            >
              <Badge 
                variant="outline" 
                className={cn(
                  "shrink-0 hover:bg-muted/50 transition-colors cursor-default",
                  variant === "compact" 
                    ? "h-6 px-2 text-xs" 
                    : "h-7 px-3 text-sm"
                )}
              >
                {language.name}
              </Badge>
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
} 