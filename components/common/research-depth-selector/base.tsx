"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  LightningIcon,
  MagnifyingGlassIcon as SearchIcon,
  BookOpenIcon,
} from "@phosphor-icons/react"
import { type ResearchDepth, RESEARCH_DEPTH_CONFIG } from "@/lib/research-depth"

export interface ResearchDepthOption {
  id: ResearchDepth
  name: string
  description: string
  searchResults: number
  icon: React.ComponentType<{ className?: string }>
}

export const RESEARCH_DEPTH_OPTIONS: ResearchDepthOption[] = [
  {
    ...RESEARCH_DEPTH_CONFIG[0],
    icon: LightningIcon,
  },
  {
    ...RESEARCH_DEPTH_CONFIG[1],
    icon: SearchIcon,
  },
  {
    ...RESEARCH_DEPTH_CONFIG[2],
    icon: BookOpenIcon,
  },
]

type ResearchDepthSelectorProps = {
  selectedDepth: ResearchDepth
  setSelectedDepth: (depth: ResearchDepth) => void
  className?: string
  isUserAuthenticated?: boolean
}

export function ResearchDepthSelector({
  selectedDepth,
  setSelectedDepth,
  className,
  isUserAuthenticated = true,
}: ResearchDepthSelectorProps) {
  const currentDepth = RESEARCH_DEPTH_OPTIONS.find(
    (depth) => depth.id === selectedDepth
  )

  if (!isUserAuthenticated) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <Select
            value={selectedDepth}
            onValueChange={(value) => setSelectedDepth(value as ResearchDepth)}
          >
            <SelectTrigger
              className={cn(
                "h-9 w-fit px-2 text-xs bg-gray-200 hover:bg-gray-300 dark:bg-accent/90 dark:hover:bg-accent/70 transition-colors border border-gray-300 dark:border-0",
                className
              )}
            >
              {currentDepth?.icon && (
                <currentDepth.icon className="h-3.5 w-3.5" />
              )}
            </SelectTrigger>
            <SelectContent className="w-[280px]">
              {RESEARCH_DEPTH_OPTIONS.map((depth) => {
                const IconComponent = depth.icon
                return (
                  <SelectItem key={depth.id} value={depth.id}>
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{depth.name}</span>
                        <span className="text-xs text-muted-foreground">{depth.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {currentDepth?.name || "Select search type"}
      </TooltipContent>
    </Tooltip>
  )
} 