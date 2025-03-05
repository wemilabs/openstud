"use server";

import { auth } from "@/lib/auth";
import {
  generateChatResponse,
  generateStreamingChatResponse,
  getConversation,
  getUserConversations,
  type ChatMessage,
} from "@/lib/ai";
import { revalidatePath } from "next/cache";

/**
 * Send a message to the AI and get a response
 *
 * @param messages Array of chat messages
 * @param conversationId Optional conversation ID
 * @returns The AI response
 */
export async function sendMessage(
  messages: ChatMessage[],
  conversationId?: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in to use the AI chat");
  }

  try {
    const response = await generateChatResponse(messages, {
      userId: session.user.id,
      conversationId,
    });

    revalidatePath("/dashboard/ai-tutor");
    return { response };
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return { error: "Failed to generate AI response" };
  }
}

/**
 * Get a conversation by ID
 *
 * @param conversationId Conversation ID
 * @returns The conversation with messages
 */
export async function getConversationById(conversationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in to access conversations");
  }

  try {
    const conversation = await getConversation(conversationId, session.user.id);
    return { conversation };
  } catch (error) {
    console.error("Error in getConversationById:", error);
    return { error: "Failed to fetch conversation" };
  }
}

/**
 * Get all conversations for the current user
 *
 * @returns Array of conversations
 */
export async function getAllConversations() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in to access conversations");
  }

  try {
    const conversations = await getUserConversations(session.user.id);
    return { conversations };
  } catch (error) {
    console.error("Error in getAllConversations:", error);
    return { error: "Failed to fetch conversations" };
  }
}
