/**
 * Chat Service
 * 
 * Service for interacting with AI chat providers and managing conversations
 */

import { aiConfig } from '../config';
import * as OpenAIProvider from '../providers/openai/chat';
import * as GrokProvider from '../providers/grok/chat';
import { prisma } from '@/lib/prisma';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  conversationId?: string;
  userId: string;
  signal?: AbortSignal;
  timeoutMs?: number; 
}

// Track active streaming requests for cancellation
export const activeStreams = new Map<string, AbortController>();

/**
 * Generate a chat completion using the configured AI provider
 * 
 * @param messages Array of messages in the conversation
 * @param options Optional parameters for the completion
 * @returns The generated completion text
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  options: ChatOptions
): Promise<string> {
  // Store the conversation and messages if a conversationId is provided
  if (options.conversationId) {
    // Only store the latest user message to avoid duplication
    const latestUserMessage = messages.filter(m => m.role === 'user').pop();
    if (latestUserMessage) {
      await storeMessages([latestUserMessage], options.conversationId);
    }
  } else if (options.userId) {
    // Create a new conversation if one doesn't exist
    const conversationId = await createConversation(options.userId, messages);
    options.conversationId = conversationId;
  }

  // Use the appropriate provider based on configuration
  switch (aiConfig.provider) {
    case 'openai':
      return OpenAIProvider.generateChatCompletion(messages, options);
    case 'grok':
      return GrokProvider.generateChatCompletion(messages, options);
    default:
      return OpenAIProvider.generateChatCompletion(messages, options);
  }
}

/**
 * Generate a streaming chat completion using the configured AI provider
 * 
 * @param messages Array of messages in the conversation
 * @param onChunk Optional callback function for each chunk of the stream
 * @param options Optional parameters for the completion
 * @returns The conversation ID and other response data
 */
export async function generateStreamingChatResponse(
  messages: ChatMessage[],
  onChunk: ((chunk: string) => void) | null,
  options: ChatOptions
): Promise<{ conversationId: string | undefined }> {
  // Create an abort controller for this stream
  const abortController = new AbortController();
  
  // Store the conversation and user message before streaming
  if (options.conversationId) {
    // Only store the latest user message to avoid duplication
    const latestUserMessage = messages.filter(m => m.role === 'user').pop();
    if (latestUserMessage) {
      await storeMessages([latestUserMessage], options.conversationId);
    }
    
    // Store the abort controller for this conversation
    activeStreams.set(options.conversationId, abortController);
  } else if (options.userId) {
    // Create a new conversation if one doesn't exist
    const conversationId = await createConversation(options.userId, 
      messages.filter(m => m.role === 'user' || m.role === 'system'));
    options.conversationId = conversationId;
    
    // Store the abort controller for this conversation
    if (conversationId) {
      activeStreams.set(conversationId, abortController);
    }
  }

  // Collect the assistant's response to store after streaming
  let assistantResponse = '';
  const wrappedOnChunk = (chunk: string) => {
    // Don't accumulate empty chunks (keepalives) or error messages into the response
    if (chunk && !chunk.startsWith('\n\n[')) {
      assistantResponse += chunk;
    }
    // Only call the callback if it's provided
    if (onChunk) {
      onChunk(chunk);
    }
  };

  try {
    // Set timeout for streaming responses - default 90 seconds or user override
    const timeoutMs = options.timeoutMs || 90000; // 90 seconds default timeout
    
    // Use the appropriate provider based on configuration
    switch (aiConfig.provider) {
      case 'openai':
        await OpenAIProvider.generateStreamingChatCompletion(
          messages, 
          wrappedOnChunk, 
          { 
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            stream: true,
            signal: options.signal || abortController.signal,
            timeoutMs
          }
        );
        break;
      case 'grok':
        await GrokProvider.generateStreamingChatCompletion(
          messages, 
          wrappedOnChunk, 
          { 
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            stream: true,
            signal: options.signal || abortController.signal,
            timeoutMs
          }
        );
        break;
      default:
        await OpenAIProvider.generateStreamingChatCompletion(
          messages, 
          wrappedOnChunk, 
          { 
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            stream: true,
            signal: options.signal || abortController.signal,
            timeoutMs
          }
        );
        break;
    }

    // Store the assistant's response after streaming is complete
    if (options.conversationId && assistantResponse) {
      await storeAIResponse(assistantResponse, options.conversationId);
    }
  } catch (error) {
    console.error('Error in streaming chat response:', error);
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      throw error;
    }
  } finally {
    // Clean up the abort controller
    if (options.conversationId) {
      activeStreams.delete(options.conversationId);
    }
  }
  
  return { conversationId: options.conversationId };
}

/**
 * Cancel an ongoing streaming chat request
 * 
 * @param conversationId The conversation ID to cancel
 * @returns True if a stream was canceled, false otherwise
 */
export function cancelChatStream(conversationId: string): boolean {
  const controller = activeStreams.get(conversationId);
  if (controller) {
    controller.abort();
    activeStreams.delete(conversationId);
    return true;
  }
  return false;
}

/**
 * Create a new conversation in the database
 * 
 * @param userId The user ID
 * @param initialMessages Initial messages to store
 * @returns The created conversation ID
 */
async function createConversation(
  userId: string,
  initialMessages: ChatMessage[] = []
): Promise<string> {
  // Extract a title from the first user message if available
  const firstUserMessage = initialMessages.find(m => m.role === 'user');
  const title = firstUserMessage 
    ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
    : 'New conversation';

  // Create a new conversation with a unique ID
  const conversation = await prisma.aIConversation.create({
    data: {
      title,
      userId,
    },
  });

  // Store initial messages if provided
  if (initialMessages.length > 0) {
    await storeMessages(initialMessages, conversation.id);
  }

  return conversation.id;
}

/**
 * Store messages in the database
 * 
 * @param messages Messages to store
 * @param conversationId Conversation ID
 * @returns Array of message records
 */
async function storeMessages(
  messages: ChatMessage[],
  conversationId: string
) {
  // Filter out system messages
  const messagesToStore = messages.filter(m => m.role !== 'system');
  
  if (messagesToStore.length === 0) {
    return [];
  }

  // Store each message
  const storedMessages = await Promise.all(
    messagesToStore.map(message =>
      prisma.aIMessage.create({
        data: {
          role: message.role,
          content: message.content,
          conversationId,
        },
      })
    )
  );

  // Update the conversation's updated timestamp
  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return storedMessages;
}

/**
 * Store an AI response in the database
 * 
 * @param content Response content
 * @param conversationId Conversation ID
 * @returns The message record
 */
async function storeAIResponse(content: string, conversationId: string) {
  // Get the conversation to get the user ID
  const conversation = await prisma.aIConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Store the AI response
  const message = await prisma.aIMessage.create({
    data: {
      role: 'assistant',
      content,
      conversationId,
    },
  });

  // Update the conversation's updated timestamp
  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

/**
 * Get a conversation by ID
 * 
 * @param conversationId Conversation ID
 * @param userId User ID
 * @returns The conversation with its messages
 */
export async function getConversation(conversationId: string, userId: string) {
  const conversation = await prisma.aIConversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  return conversation;
}

/**
 * Get all conversations for a user
 * 
 * @param userId User ID
 * @returns Array of conversations
 */
export async function getUserConversations(userId: string) {
  const conversations = await prisma.aIConversation.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  return conversations;
}

/**
 * Delete a conversation by ID
 * 
 * @param conversationId Conversation ID
 * @param userId User ID
 * @returns True if deleted successfully
 */
export async function deleteConversation(conversationId: string, userId: string): Promise<boolean> {
  try {
    // First, check if the conversation belongs to the user
    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      return false;
    }

    // Cancel any ongoing streams for this conversation
    cancelChatStream(conversationId);

    // Delete all messages in the conversation
    await prisma.aIMessage.deleteMany({
      where: {
        conversationId,
      },
    });

    // Delete the conversation
    await prisma.aIConversation.delete({
      where: {
        id: conversationId,
      },
    });

    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
}
