"use server";

import { auth } from "@/lib/auth";
import {
  generateChatResponse,
  generateStreamingChatResponse,
  getConversation,
  getUserConversations,
  deleteConversation,
  cancelChatStream,
  type ChatMessage,
} from "@/lib/ai";
import { revalidatePath } from "next/cache";

/**
 * Send a message to the AI and get a response
 *
 * @param messages Array of chat messages
 * @param conversationId Optional conversation ID
 * @returns The AI response and conversation ID
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
    return { response, conversationId };
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return { error: "Failed to generate AI response" };
  }
}

/**
 * Send a message to the AI and get a streaming response
 * This function returns a ReadableStream that can be consumed by the client
 *
 * @param messages Array of chat messages
 * @param conversationId Optional conversation ID
 * @returns A stream of text chunks and the conversation ID
 */
export async function sendMessageStream(
  messages: ChatMessage[],
  conversationId?: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in to use the AI chat");
  }

  // Extract userId to ensure TypeScript knows it's defined
  const userId = session.user.id;

  // Variable to store the conversation ID (either existing or new)
  let resultConversationId = conversationId;

  // Create a new ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      // Set up a keep-alive interval to prevent connection timeouts
      // Send a small space every 10 seconds to keep the connection alive
      const keepAliveInterval = setInterval(() => {
        if (controller) {
          try {
            // Empty space as keep-alive signal
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(" "));
          } catch (e) {
            // Controller might be closed already, clear interval
            clearInterval(keepAliveInterval);
          }
        }
      }, 10000); // Every 10 seconds

      // Set a maximum runtime timer (3 minutes) as a safety measure
      const maxRuntimeTimeout = setTimeout(() => {
        try {
          // If we hit the max runtime, send a message and close gracefully
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(
              "\n\n[Response exceeded maximum allowed time. Please ask a follow-up question to continue.]"
            )
          );
          
          // Add metadata for the client
          const metadataChunk = JSON.stringify({
            __metadata: {
              conversationId: resultConversationId,
              truncated: true
            },
          });
          controller.enqueue(encoder.encode(`\n${metadataChunk}`));
          
          controller.close();
          clearInterval(keepAliveInterval);
        } catch (e) {
          // Controller might be closed already
        }
      }, 180000); // 3 minutes max runtime
      
      try {
        let fullResponse = "";
        let isControllerActive = true;  // Track controller state
        let lastActivityTime = Date.now(); // Track last activity for partial timeouts

        // Create a callback function to handle chunks
        const handleChunk = (chunk: string) => {
          // Skip if controller is no longer active
          if (!isControllerActive) return;
          
          // Update activity timestamp
          lastActivityTime = Date.now();
          
          // Encode the chunk as a Uint8Array
          const encoder = new TextEncoder();
          const encoded = encoder.encode(chunk);

          try {
            // Add the chunk to the stream if the controller is still active
            controller.enqueue(encoded);
            
            // Accumulate the full response
            fullResponse += chunk;
          } catch (error) {
            // Controller has been closed, update our state
            isControllerActive = false;
            console.warn("Stream controller is no longer active");
          }
        };

        // Generate the streaming response
        const result = await generateStreamingChatResponse(
          messages,
          handleChunk,
          {
            userId, // Now TypeScript knows this is defined
            conversationId,
            stream: true,
          }
        );

        // Store the conversation ID for the response headers
        if (result.conversationId) {
          resultConversationId = result.conversationId;
        }

        // Add the conversation ID as the last chunk in a special format
        // that the client can parse
        const metadataChunk = JSON.stringify({
          __metadata: {
            conversationId: resultConversationId,
            complete: true
          },
        });
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`\n${metadataChunk}`));

        // Close the stream when done
        isControllerActive = false;
        controller.close();
        
        // Clear our timers
        clearInterval(keepAliveInterval);
        clearTimeout(maxRuntimeTimeout);
      } catch (error) {
        console.error("Error in sendMessageStream:", error);
        
        // Try to send error information to the client
        try {
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(
              "\n\n[An error occurred while generating the response. Please try again.]"
            )
          );
          controller.error(error);
        } catch (e) {
          // Controller might be closed already
        }
        
        // Clean up timers
        clearInterval(keepAliveInterval);
        clearTimeout(maxRuntimeTimeout);
      }
    },
  });

  return stream;
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

/**
 * Delete a conversation
 *
 * @param conversationId Conversation ID to delete
 * @returns Success or error message
 */
export async function deleteConversationById(conversationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in to delete conversations");
  }

  try {
    const success = await deleteConversation(conversationId, session.user.id);

    if (success) {
      revalidatePath("/dashboard/ai-tutor");
      return { success: true };
    } else {
      return { error: "Failed to delete conversation" };
    }
  } catch (error) {
    console.error("Error in deleteConversationById:", error);
    return { error: "Failed to delete conversation" };
  }
}

/**
 * Cancel an ongoing chat stream
 *
 * @param conversationId Conversation ID with the active stream
 * @returns Success or error message
 */
export async function cancelChatStreamById(conversationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be logged in to cancel chat streams");
  }

  try {
    const success = await cancelChatStream(conversationId);

    if (success) {
      return { success: true };
    } else {
      return { error: "No active stream found for this conversation" };
    }
  } catch (error) {
    console.error("Error in cancelChatStreamById:", error);
    return { error: "Failed to cancel chat stream" };
  }
}
