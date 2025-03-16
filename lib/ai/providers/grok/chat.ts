/**
 * Grok Chat Implementation
 * 
 * Handles chat completions using Grok's API
 */

import { grok } from './index';
import { aiConfig } from '../../config';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number; // Added timeout option
}

/**
 * Generate a chat completion using Grok
 * 
 * @param messages Array of messages in the conversation
 * @param options Optional parameters for the completion
 * @returns The generated completion text
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  try {
    const response = await grok.request('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: aiConfig.modelConfig.chatModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        stream: false,
      }),
      signal: options.signal,
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating chat completion:', error);
    // Rethrow AbortError so it can be handled properly
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Generate a streaming chat completion using Grok
 * 
 * @param messages Array of messages in the conversation
 * @param onChunk Callback function for each chunk of the stream
 * @param options Optional parameters for the completion
 */
export async function generateStreamingChatCompletion(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  options: ChatOptions = {}
): Promise<void> {
  // Default timeout of 60 seconds (can be overridden)
  const timeoutMs = options.timeoutMs || 60000;
  
  // Create an abort controller for the timeout
  const timeoutController = new AbortController();
  
  // Setup the combined signal if user provided one
  let signal = timeoutController.signal;
  if (options.signal) {
    signal = options.signal;
  }
  
  // Setup timeout
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, timeoutMs);
  
  // Track when we last received content
  let lastContentTime = Date.now();
  // If we haven't received content for this long, send keepalive
  const keepaliveThresholdMs = 10000; // 10 seconds
  
  try {
    const response = await grok.request('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: aiConfig.modelConfig.chatModel,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        stream: true,
      }),
      signal,
    });

    // Create a reader from the response body stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    // Function to check if we need a keepalive
    const checkKeepAlive = () => {
      const now = Date.now();
      if (now - lastContentTime > keepaliveThresholdMs) {
        // Send empty keepalive to client to keep connection alive
        onChunk('');
        lastContentTime = now;
      }
    };
    
    // Set up keepalive interval
    const keepaliveInterval = setInterval(checkKeepAlive, 5000); // Check every 5 seconds
    
    // Read the stream
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Update last content time
        lastContentTime = Date.now();
        
        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // Process each line (each SSE event)
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        let hasContent = false;
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            // Skip the [DONE] message
            if (data === '[DONE]') continue;
            
            try {
              const parsedData = JSON.parse(data);
              const content = parsedData.choices[0]?.delta?.content || '';
              if (content) {
                hasContent = true;
                onChunk(content);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
              // Continue processing other lines even if one fails
            }
          }
        }
        
        // Reset the timeout if we got content
        if (hasContent) {
          clearTimeout(timeoutId);
          // Set a new timeout
          setTimeout(() => {
            timeoutController.abort();
          }, timeoutMs);
        }
      }
    } finally {
      // Clean up
      clearInterval(keepaliveInterval);
      clearTimeout(timeoutId);
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    console.error('Error generating streaming chat completion:', error);
    
    // Check if it's a timeout error
    if (error instanceof DOMException && error.name === 'AbortError') {
      // Send a completion message to client so it knows streaming is done
      onChunk('\n\n[Generation interrupted due to timeout. The response may be incomplete.]');
      throw error;
    }
    
    // For other errors, also try to notify the client
    onChunk('\n\n[Error occurred during generation. The response may be incomplete.]');
    throw new Error('Failed to generate streaming AI response');
  }
}
