"use client"

import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "motion/react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const languages = [
  { code: "EN", name: "English", example: "Search anything..." },
  { code: "ZH", name: "中文", example: "搜索任何内容..." },
  { code: "HI", name: "हिंदी", example: "कुछ भी खोजें..." },
  { code: "ES", name: "Español", example: "Buscar cualquier cosa..." },
  { code: "AR", name: "العربية", example: "ابحث عن أي شيء..." },
  { code: "BN", name: "বাংলা", example: "যেকোনো কিছু খুঁজুন..." },
  { code: "PT", name: "Português", example: "Pesquisar qualquer coisa..." },
  { code: "RU", name: "Русский", example: "Искать что угодно..." },
  { code: "JA", name: "日本語", example: "何でも検索..." },
  { code: "PA", name: "ਪੰਜਾਬੀ", example: "ਕੁਝ ਵੀ ਖੋਜੋ..." },
  { code: "DE", name: "Deutsch", example: "Alles durchsuchen..." },
  { code: "JV", name: "Basa Jawa", example: "Goleki apa wae..." },
  { code: "KO", name: "한국어", example: "무엇이든 검색..." },
  { code: "FR", name: "Français", example: "Rechercher n'importe quoi..." },
  { code: "TE", name: "తెలుగు", example: "ఏదైనా వెతకండి..." },
  { code: "MR", name: "मराठी", example: "काहीही शोधा..." },
  { code: "TR", name: "Türkçe", example: "Her şeyi arayın..." },
  { code: "TA", name: "தமிழ்", example: "எதையும் தேடுங்கள்..." },
  { code: "VI", name: "Tiếng Việt", example: "Tìm kiếm bất cứ điều gì..." },
  { code: "UR", name: "اردو", example: "کچھ بھی تلاش کریں..." },
  { code: "IT", name: "Italiano", example: "Cerca qualsiasi cosa..." },
  { code: "TH", name: "ไทย", example: "ค้นหาอะไรก็ได้..." },
  { code: "GU", name: "ગુજરાતી", example: "કંઈપણ શોધો..." },
  { code: "PL", name: "Polski", example: "Szukaj czegokolwiek..." },
  { code: "UK", name: "Українська", example: "Шукайте що завгодно..." },
  { code: "ML", name: "മലയാളം", example: "എന്തും തിരയുക..." },
  { code: "KN", name: "ಕನ್ನಡ", example: "ಏನನ್ನಾದರೂ ಹುಡುಕಿ..." },
  { code: "MY", name: "မြန်မာ", example: "ဘာမဆို ရှာပါ..." },
  { code: "SW", name: "Kiswahili", example: "Tafuta chochote..." },
  { code: "AM", name: "አማርኛ", example: "ማንኛውንም ነገር ይፈልጉ..." },
  { code: "HA", name: "Hausa", example: "Bincika komai..." },
  { code: "YO", name: "Yorùbá", example: "Wa ohunkohun..." },
  { code: "IG", name: "Igbo", example: "Chọọ ihe ọ bụla..." },
  { code: "NL", name: "Nederlands", example: "Zoek naar alles..." },
  { code: "RO", name: "Română", example: "Căutați orice..." },
  { code: "HU", name: "Magyar", example: "Kereszen bármit..." },
  { code: "CS", name: "Čeština", example: "Hledejte cokoliv..." },
  { code: "EL", name: "Ελληνικά", example: "Αναζητήστε οτιδήποτε..." },
  { code: "BG", name: "Български", example: "Търсете всичко..." },
  { code: "HR", name: "Hrvatski", example: "Pretražite bilo što..." },
  { code: "SK", name: "Slovenčina", example: "Hľadajte čokoľvek..." },
  { code: "SL", name: "Slovenščina", example: "Iščite karkoli..." },
  { code: "LV", name: "Latviešu", example: "Meklējiet jebko..." },
  { code: "LT", name: "Lietuvių", example: "Ieškokite bet ko..." },
  { code: "ET", name: "Eesti", example: "Otsige midagi..." },
  { code: "FI", name: "Suomi", example: "Etsi mitä tahansa..." },
  { code: "DA", name: "Dansk", example: "Søg efter alt..." },
  { code: "SV", name: "Svenska", example: "Sök efter vad som helst..." },
  { code: "NO", name: "Norsk", example: "Søk etter hva som helst..." },
  { code: "IS", name: "Íslenska", example: "Leitaðu að hverju sem er..." },
  { code: "HE", name: "עברית", example: "חפש כל דבר..." },
  { code: "FA", name: "فارسی", example: "هر چیزی را جستجو کنید..." },
  { code: "MS", name: "Bahasa Melayu", example: "Cari apa sahaja..." },
  { code: "ID", name: "Bahasa Indonesia", example: "Cari apa saja..." },
  { code: "TL", name: "Filipino", example: "Maghanap ng kahit ano..." },
]

interface LanguageIndicatorProps {
  className?: string
  variant?: "subtle" | "prominent" | "compact"
}

// Simple globe icon component
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}

export function LanguageIndicator({ 
  className, 
  variant = "subtle" 
}: LanguageIndicatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % languages.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [])

  const currentLanguage = languages[currentIndex]

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <GlobeIcon className="text-muted-foreground/60" />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLanguage.code}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Badge 
              variant="outline" 
              className="h-4 px-1.5 text-xs border-muted-foreground/20 bg-muted/20"
            >
              {currentLanguage.name}
            </Badge>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  if (variant === "prominent") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GlobeIcon />
          <span>Search in</span>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLanguage.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1"
            >
              <Badge variant="outline" className="">
                {currentLanguage.name}
              </Badge>
            </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLanguage.example}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-muted-foreground/70 italic"
          >
            "{currentLanguage.example}"
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <GlobeIcon className="size-3" />
        <span>Search in</span>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLanguage.code}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Badge 
              variant="outline" 
              className="h-5 px-1.5 text-xs border-muted-foreground/20"
            >
              {currentLanguage.name}
            </Badge>
          </motion.div>
        </AnimatePresence>
        <span>and {languages.length - 1}+ more</span>
      </div>
    </div>
  )
} 