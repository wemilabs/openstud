'use client';

import { useCallback } from 'react';
import { type ChatMessage } from '@/lib/ai';

/**
 * Custom hook for Edge API streaming chat functionality
 * This bypasses Vercel serverless function timeouts by using the Edge runtime
 */
export function useEdgeStreamingChat() {
  /**
   * Send a chat message and receive a streaming response from the Edge API
   */
  const streamChat = useCallback(async (
    messages: ChatMessage[], 
    conversationId: string | undefined,
    onChunk: (chunk: string) => void,
    onError: (error: Error) => void,
    onComplete: (conversationId: string) => void,
    signal?: AbortSignal
  ) => {
    try {
      // Prepare the request
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, conversationId }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Set up streaming reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let metadataReceived = false;
      let receivedConversationId = conversationId;
      
      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // Check if this chunk contains metadata (at the end)
        if (chunk.includes('"__metadata":')) {
          try {
            // Extract and parse the metadata
            const metadataJson = chunk.substring(chunk.indexOf('\n{'));
            const metadata = JSON.parse(metadataJson);
            
            if (metadata.__metadata?.conversationId) {
              receivedConversationId = metadata.__metadata.conversationId;
              metadataReceived = true;
            }
            
            // Don't send the metadata to the UI
            const contentPart = chunk.substring(0, chunk.indexOf('\n{'));
            if (contentPart) {
              onChunk(contentPart);
            }
          } catch (e) {
            console.error('Error parsing metadata:', e);
            // If we can't parse metadata, treat it as regular content
            onChunk(chunk);
          }
        } else {
          // Regular content chunk
          onChunk(chunk);
        }
      }
      
      // Call onComplete with the conversation ID
      if (receivedConversationId) {
        onComplete(receivedConversationId);
      } else {
        console.warn('No conversation ID received from stream');
        // If we somehow didn't get a conversation ID, still call onComplete
        onComplete(conversationId || '');
      }
    } catch (error) {
      if (error instanceof Error) {
        // Skip AbortError as it's expected when the user cancels
        if (error.name !== 'AbortError') {
          console.error('Error in streamChat:', error);
          onError(error);
        }
      } else {
        onError(new Error('Unknown error occurred'));
      }
    }
  }, []);

  return { streamChat };
}

/**
 * Example usage:
 * 
 * const { streamChat } = useEdgeStreamingChat();
 * const abortController = new AbortController();
 * 
 * // Start streaming
 * streamChat(
 *   messages,
 *   conversationId,
 *   (chunk) => setPartialResponse(prev => prev + chunk),
 *   (error) => setError(error.message),
 *   (newConversationId) => setConversationId(newConversationId),
 *   abortController.signal
 * );
 * 
 * // To stop streaming
 * const handleStop = () => {
 *   abortController.abort();
 * };
 */
