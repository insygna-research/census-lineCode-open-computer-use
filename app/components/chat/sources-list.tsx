"use client"

import { cn } from "@/lib/utils"
import type { SourceUIPart } from "@ai-sdk/ui-utils"
import { ArrowSquareOut, Globe } from "@phosphor-icons/react"
import Image from "next/image"
import { useState } from "react"
import { addUTM, formatUrl, getFavicon } from "./utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

type SourcesListProps = {
  sources: SourceUIPart["source"][]
  className?: string
}

export function SourcesList({ sources, className }: SourcesListProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [failedFavicons, setFailedFavicons] = useState<Set<string>>(new Set())

  const handleFaviconError = (url: string) => {
    setFailedFavicons((prev) => new Set(prev).add(url))
  }

  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return url
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn("px-5 py-2.5", className)}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="hover:bg-muted/50 flex w-full flex-row items-center rounded-3xl px-4 py-3 transition-all duration-200 border border-border/50 bg-muted/30 hover:shadow-sm"
          >
            <div className="flex flex-1 flex-row items-center gap-3 text-left text-sm font-medium min-w-0 overflow-hidden">
              <Globe className="text-green-600 dark:text-green-400 size-4 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-200 flex-shrink-0">Visited websites</span>
              <div className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0">
                {sources.length}
              </div>
              <div className="flex -space-x-1 ml-2 flex-shrink-0 items-center">
                {sources?.slice(0, 3).map((source, index) => {
                  const faviconUrl = getFavicon(source.url)
                  const showFallback = !faviconUrl || failedFavicons.has(source.url)

                  return (
                    <div key={`favicon-${source.id || source.url}-${index}`} className="relative flex-shrink-0">
                      {showFallback ? (
                        <div className="bg-muted border-background h-4 w-4 rounded-full border" />
                      ) : (
                        <Image
                          src={faviconUrl}
                          alt={`Favicon for ${source.title}`}
                          width={16}
                          height={16}
                          className="border-background h-4 w-4 rounded-sm border"
                          onError={() => handleFaviconError(source.url)}
                        />
                      )}
                    </div>
                  )
                })}
                {sources.length > 3 && (
                  <span className="text-green-700 dark:text-green-400 ml-1 text-xs whitespace-nowrap">
                    +{sources.length - 3}
                  </span>
                )}
              </div>
            </div>
          </button>
        </DialogTrigger>
      </div>

      <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900">
              <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Visited Websites
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Web search across {sources.length} visited websites
              </p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-5rem)]">
          <div className="grid gap-3 p-6">
            {sources.map((source, idx) => {
              const faviconUrl = getFavicon(source.url)
              const showFallback = !faviconUrl || failedFavicons.has(source.url)
              const domain = getDomain(source.url)

              return (
                <a
                  key={source.id || `${source.url}-${idx}`}
                  href={addUTM(source.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                        {showFallback ? (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-sm font-semibold text-gray-600 dark:from-gray-700 dark:to-gray-800 dark:text-gray-400">
                            {domain.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <Image
                            src={faviconUrl}
                            alt={`${source.title} favicon`}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            onError={() => handleFaviconError(source.url)}
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                            {source.title}
                          </h3>
                          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {domain}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            #{idx + 1}
                          </Badge>
                          <ArrowSquareOut className="h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-green-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
