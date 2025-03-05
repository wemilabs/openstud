/**
 * Chat Service
 * 
 * Service for interacting with AI chat providers and managing conversations
 */

import { aiConfig } from '../config';
import * as OpenAIProvider from '../providers/openai/chat';
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
}

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
    await storeMessages(messages, options.conversationId, options.userId);
  } else if (options.userId) {
    // Create a new conversation if one doesn't exist
    const conversationId = await createConversation(options.userId, messages);
    options.conversationId = conversationId;
  }

  // Use the appropriate provider based on configuration
  switch (aiConfig.provider) {
    case 'openai':
      return OpenAIProvider.generateChatCompletion(messages, options);
    // Add other providers here as they are implemented
    default:
      return OpenAIProvider.generateChatCompletion(messages, options);
  }
}

/**
 * Generate a streaming chat completion using the configured AI provider
 * 
 * @param messages Array of messages in the conversation
 * @param onChunk Callback function for each chunk of the stream
 * @param options Optional parameters for the completion
 */
export async function generateStreamingChatResponse(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  options: ChatOptions
): Promise<void> {
  // Store the conversation and user message before streaming
  if (options.conversationId) {
    // Only store user messages before streaming
    const userMessages = messages.filter(m => m.role === 'user' || m.role === 'system');
    await storeMessages(userMessages, options.conversationId, options.userId);
  } else if (options.userId) {
    // Create a new conversation if one doesn't exist
    const conversationId = await createConversation(options.userId, 
      messages.filter(m => m.role === 'user' || m.role === 'system'));
    options.conversationId = conversationId;
  }

  // Collect the assistant's response to store after streaming
  let assistantResponse = '';
  const wrappedOnChunk = (chunk: string) => {
    assistantResponse += chunk;
    onChunk(chunk);
  };

  // Use the appropriate provider based on configuration
  switch (aiConfig.provider) {
    case 'openai':
      await OpenAIProvider.generateStreamingChatCompletion(messages, wrappedOnChunk, options);
      break;
    // Add other providers here as they are implemented
    default:
      await OpenAIProvider.generateStreamingChatCompletion(messages, wrappedOnChunk, options);
      break;
  }

  // Store the assistant's response after streaming is complete
  if (options.conversationId && assistantResponse) {
    await storeAIResponse(assistantResponse, options.conversationId);
  }
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

  // Create or update the conversation
  const conversation = await prisma.aIConversation.upsert({
    where: {
      id: 'new-conversation',
    },
    update: {
      updatedAt: new Date(),
    },
    create: {
      title,
      userId,
    },
  });

  // Store initial messages if provided
  if (initialMessages.length > 0) {
    await storeMessages(initialMessages, conversation.id, userId);
  }

  return conversation.id;
}

/**
 * Store messages in the database
 * 
 * @param messages Messages to store
 * @param conversationId Conversation ID
 * @param userId User ID
 */
async function storeMessages(
  messages: ChatMessage[],
  conversationId: string,
  userId: string
): Promise<void> {
  // Verify the conversation belongs to the user
  const conversation = await prisma.aIConversation.findUnique({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error('Conversation not found or does not belong to the user');
  }

  // Store each message
  await Promise.all(
    messages.map(message =>
      prisma.aIMessage.create({
        data: {
          role: message.role,
          content: message.content,
          conversationId,
        },
      })
    )
  );
}

/**
 * Store an AI response in the database
 * 
 * @param content Response content
 * @param conversationId Conversation ID
 * @returns The message record
 */
async function storeAIResponse(content: string, conversationId: string) {
  return prisma.aIMessage.create({
    data: {
      role: 'assistant',
      content,
      conversationId,
    },
  });
}

/**
 * Get a conversation by ID
 * 
 * @param conversationId Conversation ID
 * @param userId User ID
 * @returns The conversation with its messages
 */
export async function getConversation(conversationId: string, userId: string) {
  return prisma.aIConversation.findUnique({
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
}

/**
 * Get all conversations for a user
 * 
 * @param userId User ID
 * @returns Array of conversations
 */
export async function getUserConversations(userId: string) {
  return prisma.aIConversation.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      messages: {
        take: 1,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
}
