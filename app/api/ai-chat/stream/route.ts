// Force the Edge Runtime for this API route
export const runtime = 'edge';

import { auth } from "@/lib/auth";
import { 
  generateStreamingChatResponse,
  type ChatMessage 
} from "@/lib/ai";

/**
 * POST handler for AI chat streaming
 * This API route specifically uses Edge Runtime to handle long-running streaming responses
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Parse the request body
    const body = await request.json();
    const { messages, conversationId } = body as { 
      messages: ChatMessage[],
      conversationId?: string 
    };

    // Ensure we have valid messages
    if (!Array.isArray(messages) || !messages.length) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Variable to store the conversation ID (either existing or new)
    let resultConversationId = conversationId;

    // Create a new ReadableStream specifically for Edge runtime
    const stream = new ReadableStream({
      async start(controller) {
        // Set up a keep-alive interval to prevent connection timeouts
        // Send a small space every 5 seconds to keep the connection alive
        const keepAliveInterval = setInterval(() => {
          try {
            // Empty space as keep-alive signal
            controller.enqueue(new TextEncoder().encode(" "));
          } catch (e) {
            // Controller might be closed already, clear interval
            clearInterval(keepAliveInterval);
          }
        }, 5000); // Every 5 seconds (more frequent in edge runtime)

        try {
          let fullResponse = "";

          // Create a callback function to handle chunks
          const handleChunk = (chunk: string) => {
            // Encode the chunk as a Uint8Array
            const encoder = new TextEncoder();
            
            try {
              // Add the chunk to the stream
              controller.enqueue(encoder.encode(chunk));
              
              // Accumulate the full response
              fullResponse += chunk;
            } catch (error) {
              console.warn("Stream controller is no longer active");
            }
          };

          // Generate the streaming response
          const result = await generateStreamingChatResponse(
            messages,
            handleChunk,
            {
              userId: session.user?.id || "", // Add null check and fallback
              conversationId: conversationId || undefined, // Properly handle undefined
              stream: true,
            }
          );

          // Store the conversation ID for the response headers
          if (result.conversationId) {
            resultConversationId = result.conversationId;
          }

          // Add the conversation ID as the last chunk in a special format
          const metadataChunk = JSON.stringify({
            __metadata: {
              conversationId: resultConversationId || "", // Add fallback for undefined
              complete: true
            },
          });
          
          controller.enqueue(new TextEncoder().encode(`\n${metadataChunk}`));

          // Close the stream when done
          controller.close();
          
          // Clear the keep-alive interval
          clearInterval(keepAliveInterval);
        } catch (error) {
          console.error("Error in streaming response:", error);
          
          // Try to send error information to the client
          try {
            controller.enqueue(
              new TextEncoder().encode(
                "\n\n[An error occurred while generating the response. Please try again.]"
              )
            );
            controller.close();
          } catch (e) {
            // Controller might be closed already
          }
          
          // Clean up timer
          clearInterval(keepAliveInterval);
        }
      },
    });

    // Return the stream with appropriate headers for text/event-stream
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
