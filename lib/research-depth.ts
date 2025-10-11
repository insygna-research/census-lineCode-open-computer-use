export type ResearchDepth = "quick" | "moderate" | "deep"

export interface ResearchDepthConfig {
  id: ResearchDepth
  name: string
  description: string
  searchResults: number
}

export const RESEARCH_DEPTH_CONFIG: ResearchDepthConfig[] = [
  {
    id: "quick",
    name: "Express Search",
    description: "Swift and surgical - essential results only",
    searchResults: 3,
  },
  {
    id: "moderate", 
    name: "Professional Search",
    description: "Goldilocks approved - just the right amount",
    searchResults: 5,
  },
  {
    id: "deep",
    name: "Scholar Mode",
    description: "Leave no stone unturned - maximum detail and context",
    searchResults: 10,
  },
]

export function getSearchResultsCount(depth: ResearchDepth): number {
  const config = RESEARCH_DEPTH_CONFIG.find(d => d.id === depth)
  return config?.searchResults || 5
} 