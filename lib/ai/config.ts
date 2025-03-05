/**
 * AI Provider Configuration
 * 
 * This file contains configuration for different AI providers.
 * Currently supports OpenAI, with architecture ready for additional providers.
 */

export type AIProviderType = 'openai' | 'grok';

interface AIConfig {
  provider: AIProviderType;
  modelConfig: {
    chatModel: string;
    embeddingModel: string;
  };
}

// Default configuration using environment variables
export const aiConfig: AIConfig = {
  provider: (process.env.AI_PROVIDER as AIProviderType) || 'openai',
  modelConfig: {
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  },
};

// OpenAI specific configuration
export const openAIConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION,
};

// Placeholder for Grok configuration
export const grokConfig = {
  apiKey: process.env.GROK_API_KEY,
};

// Export the current provider's configuration
export const getCurrentProviderConfig = () => {
  switch (aiConfig.provider) {
    case 'openai':
      return openAIConfig;
    case 'grok':
      return grokConfig;
    default:
      return openAIConfig;
  }
};
