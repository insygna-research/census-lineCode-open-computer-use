import type { Database, Json } from "@/app/types/database.types"
import type { Attachment } from "@ai-sdk/ui-utils"
import type { SupabaseClient } from "@supabase/supabase-js"

export type SupabaseClientType = SupabaseClient<Database>

export interface ContentPart {
  type: string
  text?: string
  toolCallId?: string
  toolName?: string
  args?: Json
  result?: Json
  toolInvocation?: {
    state: string
    step: number
    toolCallId: string
    toolName: string
    args?: Json
    result?: Json
  }
  reasoning?: string
  details?: Json[]
}

export interface Message {
  role: "user" | "assistant" | "system" | "data" | "tool" | "tool-call"
  content: string | null | ContentPart[]
  reasoning?: string
}

export interface ChatApiParams {
  userId: string
  model: string
  isAuthenticated: boolean
}

export interface LogUserMessageParams {
  supabase: SupabaseClientType
  userId: string
  chatId: string
  content: string
  attachments?: Attachment[]
  model: string
  isAuthenticated: boolean
  message_group_id?: string
}

export interface StoreAssistantMessageParams {
  supabase: SupabaseClientType
  chatId: string
  messages: Message[]
  message_group_id?: string
  model?: string
}

export interface ApiErrorResponse {
  error: string
  details?: string
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data?: T
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

export interface DiscoverFeedItem {
  id: string
  type: 'chat' | 'trending_topic' | 'popular_search' | 'recommended_model'
  title: string
  description?: string
  content?: string
  preview?: string
  model?: string
  models?: string[]
  tags?: string[]
  created_at: string
  updated_at: string
  user_id?: string
  username?: string
  avatar?: string
  engagement?: {
    views: number
    likes: number
    bookmarks: number
    shares: number
    comments: number
  }
  metadata?: {
    chat_id?: string
    message_count?: number
    conversation_length?: number
    research_depth?: string
    topics?: string[]
    sentiment?: 'positive' | 'negative' | 'neutral'
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  }
  trending_score?: number
  recommendation_score?: number
  is_bookmarked?: boolean
  is_liked?: boolean
}

export interface TrendingTopic {
  id: string
  name: string
  description: string
  tag: string
  chat_count: number
  message_count: number
  unique_users: number
  growth_rate: number
  trending_score: number
  created_at: string
  updated_at: string
  sample_chats: {
    id: string
    title: string
    preview: string
    model: string
    created_at: string
  }[]
}

export interface PopularSearch {
  id: string
  query: string
  category: string
  search_count: number
  unique_users: number
  success_rate: number
  avg_response_time: number
  trending_score: number
  created_at: string
  updated_at: string
  sample_results: {
    title: string
    preview: string
    model: string
  }[]
}

export interface UserEngagement {
  user_id: string
  item_id: string
  item_type: string
  action: 'view' | 'like' | 'bookmark' | 'share' | 'comment'
  created_at: string
  metadata?: Record<string, any>
}

export interface DiscoverFilters {
  models?: string[]
  topics?: string[]
  date_range?: {
    start: string
    end: string
  }
  engagement_min?: number
  difficulty_level?: string[]
  content_type?: string[]
  sort_by?: 'trending' | 'recent' | 'popular' | 'recommended'
  limit?: number
  offset?: number
}

export interface DiscoverFeedResponse {
  items: DiscoverFeedItem[]
  trending_topics: TrendingTopic[]
  popular_searches: PopularSearch[]
  has_more: boolean
  total_count: number
  next_offset?: number
  filters_applied: DiscoverFilters
}

export interface UserRecommendations {
  user_id: string
  based_on: 'favorite_models' | 'chat_history' | 'interests' | 'similar_users'
  recommendations: DiscoverFeedItem[]
  confidence_score: number
  generated_at: string
}
