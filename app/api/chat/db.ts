import type { ContentPart, Message } from "@/app/types/api.types"
import type { Database, Json } from "@/app/types/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_STEP = 0

export async function saveFinalAssistantMessage(
  supabase: SupabaseClient<Database>,
  chatId: string,
  messages: Message[],
  message_group_id?: string,
  model?: string
) {
  // Saving assistant message
  
  const parts: ContentPart[] = []
  const textParts: string[] = []

  // Process messages - preserve all content and tool invocations
  for (const msg of messages) {
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "text") {
          textParts.push(part.text || "")
          parts.push(part)
        } else if (part.type === "tool-invocation" && part.toolInvocation) {
          // Always preserve tool invocations (both call and result states)
          parts.push({
            ...part,
            toolInvocation: {
              ...part.toolInvocation,
              args: part.toolInvocation?.args || {},
            },
          })
        } else if (part.type === "reasoning") {
          parts.push({
            type: "reasoning",
            reasoning: part.text || "",
            details: [
              {
                type: "text",
                text: part.text || "",
              },
            ],
          })
        } else if (part.type === "step-start") {
          parts.push(part)
        }
      }
    } else if (msg.role === "tool" && Array.isArray(msg.content)) {
      // Handle tool results from separate tool messages
      for (const part of msg.content) {
        if (part.type === "tool-result") {
          parts.push({
            type: "tool-invocation",
            toolInvocation: {
              state: "result",
              step: DEFAULT_STEP,
              toolCallId: part.toolCallId || "",
              toolName: part.toolName || "",
              result: part.result,
            },
          })
        }
      }
    }
  }

  const finalPlainText = textParts.join("\n\n")

  // Inserting message with content parts

  // Check if this is a collaborative room first
  const { data: chatData } = await supabase
    .from('chats')
    .select('collaborative')
    .eq('id', chatId)
    .single();

  const isCollaborativeRoom = chatData?.collaborative === true;

  if (isCollaborativeRoom) {
    // Collaborative room detected
    // For collaborative rooms, we'll use the standard insert but with better error handling
  }

  // Standard approach for non-collaborative rooms or fallback
  const messageToInsert = {
    chat_id: chatId,
    role: "assistant" as const,
    content: finalPlainText || "",
    parts: parts as unknown as Json,
    message_group_id,
    model,
    // Don't include user_id for assistant messages - they're system generated
  };

  // Database insertion - store full message content
  const { error, data } = await supabase.from("messages").insert(messageToInsert).select('id, created_at')

  if (error) {
    console.error("Save error:", error)
    
    // Provide concise error info for production
    if (error.code === '42501') {
      console.error("RLS Policy Violation - user lacks permission")
    }
    
    throw new Error(`Failed to save assistant message: ${error.message}`)
  } else {
    // Message saved successfully
    return data?.[0]
  }
}
