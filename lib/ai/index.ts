/**
 * AI Service Index
 *
 * Main export file for AI services
 */

export * from "./config";

// Core services that work in all environments
export * from "./services/chat-service";

// Node.js specific services (don't import in Edge runtime)
// Use this import for regular API routes
export * from "./services/embedding-service";

// Edge-compatible exports (safe to use in Edge API routes)
// Move any additional Edge-compatible providers here
export * as GrokProvider from "./providers/grok";

// Edge-specific types that are safe to import
export type { ChatMessage, ChatCompletionOptions } from "./types";
