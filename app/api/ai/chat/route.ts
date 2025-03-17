import { NextRequest } from 'next/server';
import { auth } from "@/lib/auth";
import { generateStreamingChatResponse } from "@/lib/ai";
import { type ChatMessage } from "@/lib/ai";

// Use Edge runtime for better streaming support
export const runtime = 'edge';
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic';

/**
 * Handles streaming chat completion requests
 * Edge functions have better timeout characteristics than standard serverless functions
 */
export async function POST(request: NextRequest) {
  try {
    // Get session data (note: this might need to be adapted for Edge)
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract userId to ensure TypeScript knows it's defined
    const userId = session.user.id;

    // Parse the request body
    const { messages, conversationId } = await request.json();

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set up a TransformStream to handle the streaming response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    // Create a streaming response using ReadableStream and TransformStream
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Variable to store the conversation ID
    let resultConversationId = conversationId || '';
    let fullResponse = '';

    // Start a separate async process to handle the streaming
    (async () => {
      try {
        // Callback for handling chunks
        const handleChunk = (chunk: string) => {
          fullResponse += chunk;
          writer.write(encoder.encode(chunk));
        };

        // Generate the streaming response
        const result = await generateStreamingChatResponse(
          messages as ChatMessage[],
          handleChunk,
          {
            userId,
            conversationId,
            stream: true,
            timeoutMs: 600000, // 10 minutes max
          }
        );

        // Store the conversation ID
        if (result.conversationId) {
          resultConversationId = result.conversationId;
        }

        // Add the conversation ID as metadata
        const metadataChunk = JSON.stringify({
          __metadata: {
            conversationId: resultConversationId,
          },
        });
        writer.write(encoder.encode(`\n${metadataChunk}`));

        // Close the writer when done
        await writer.close();
      } catch (error) {
        console.error('Error in streaming response:', error);
        
        // Try to write an error message if possible
        try {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          writer.write(encoder.encode(`\n\n[Error: ${errorMessage}]`));
          await writer.close();
        } catch (writeError) {
          // If we can't write to the stream, try to abort it
          try {
            await writer.abort(error);
          } catch {
            // Last resort, just log the error
            console.error('Failed to handle stream error gracefully', writeError);
          }
        }
      }
    })();

    // Return the readable stream immediately
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      }
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
