/**
 * Common AI service types 
 * 
 * Edge-compatible type definitions that can be safely imported in Edge runtime
 */

/**
 * Chat message format used across the application
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
}

/**
 * Options for chat completion requests
 */
export interface ChatCompletionOptions {
  userId?: string;
  conversationId?: string;
  stream?: boolean;
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}
