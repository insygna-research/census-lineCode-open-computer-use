"use client"

import { Badge } from "@/components/ui/badge"
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

interface LanguageAutoScrollProps {
  className?: string
  variant?: "default" | "compact"
  speed?: number
}

export function LanguageAutoScroll({ 
  className, 
  variant = "default",
  speed = 30
}: LanguageAutoScrollProps) {
  // Double the languages array to create seamless infinite scroll
  const doubleLanguages = [...languages, ...languages]

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <div className="relative w-full overflow-hidden">
        <div className="w-full overflow-hidden">
          <div
            className="flex space-x-2 sm:space-x-3 py-1 sm:py-2 animate-scroll"
            style={{
              width: "max-content",
              animationDuration: `${speed}s`,
            }}
          >
            {doubleLanguages.map((language, index) => (
              <Badge 
                key={`${language.code}-${index}`}
                variant="outline" 
                className={cn(
                  "shrink-0 whitespace-nowrap border-muted-foreground/20 bg-muted hover:bg-muted-foreground/20 transition-colors",
                  // Responsive sizing
                  variant === "compact" 
                    ? "h-5 px-1.5 text-[10px] sm:h-6 sm:px-2 sm:text-xs" 
                    : "h-6 px-2 text-xs sm:h-7 sm:px-3 sm:text-sm"
                )}
              >
                {language.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 