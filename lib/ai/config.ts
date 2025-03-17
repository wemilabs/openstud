/**
 * AI Provider Configuration
 *
 * This file contains configuration for Grok AI provider.
 */

interface AIConfig {
  modelConfig: {
    chatModel: string;
    embeddingModel?: string;
  };
}

// Default configuration using environment variables
export const aiConfig: AIConfig = {
  modelConfig: {
    chatModel: process.env.GROK_AI_CHAT_MODEL || "grok-2-vision-latest",
  },
};

// Grok configuration
export const grokConfig = {
  apiKey: process.env.GROK_API_KEY!,
  baseUrl: process.env.GROK_API_BASE_URL!,
};

export function getCurrentProviderConfig() {
  return grokConfig;
}
