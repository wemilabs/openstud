/**
 * AI Service Index
 * 
 * Main export file for AI services
 */

// Export configuration
export * from './config';

// Export services
export * from './services/chat-service';
export * from './services/embedding-service';

// Export provider-specific implementations for direct access if needed
export * as OpenAIProvider from './providers/openai';
