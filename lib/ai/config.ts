/**
 * AI Provider Configuration
 *
 * This file contains configuration for different AI providers.
 * Currently supports OpenAI and Grok, with architecture ready for additional providers.
 */

export type AIProviderType = "openai" | "grok";

interface AIConfig {
  provider: AIProviderType;
  modelConfig: {
    chatModel: string;
    embeddingModel: string;
  };
}

// Default configuration using environment variables
export const aiConfig: AIConfig = {
  provider: (process.env.AI_PROVIDER as AIProviderType) || "grok",
  modelConfig: {
    chatModel:
      process.env.AI_CHAT_MODEL ||
      (process.env.AI_PROVIDER === "openai"
        ? "gpt-3.5-turbo"
        : "grok-2-latest"),
    embeddingModel:
      process.env.AI_EMBEDDING_MODEL ||
      (process.env.AI_PROVIDER === "openai"
        ? "text-embedding-3-small"
        : "grok-embedding-1"),
  },
};

// OpenAI specific configuration
export const openAIConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
};

// Grok configuration
export const grokConfig = {
  apiKey: process.env.GROK_API_KEY,
};

// Export the current provider's configuration
export const getCurrentProviderConfig = () => {
  switch (aiConfig.provider) {
    case "openai":
      return openAIConfig;
    case "grok":
      return grokConfig;
    default:
      return openAIConfig;
  }
};
