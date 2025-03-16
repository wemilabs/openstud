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
      timeoutMs: options.timeoutMs || 60000,
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
 * Split long messages for better streaming performance with Grok
 * Grok can sometimes have issues with very long messages
 */
function preprocessMessages(messages: ChatMessage[]): ChatMessage[] {
  const MAX_MESSAGE_LENGTH = 6000; // Characters per message chunk
  
  return messages.map(message => {
    // Only process long user or system messages
    if ((message.role === 'user' || message.role === 'system') && 
        message.content.length > MAX_MESSAGE_LENGTH) {
      
      // Split the message content into reasonable chunks
      const chunks = [];
      let content = message.content;
      
      while (content.length > 0) {
        // Find a good breaking point (sentence or paragraph end)
        let breakPoint = Math.min(MAX_MESSAGE_LENGTH, content.length);
        
        if (breakPoint < content.length) {
          // Try to break at a paragraph
          const paragraphBreak = content.lastIndexOf('\n\n', breakPoint);
          if (paragraphBreak > breakPoint * 0.7) {
            breakPoint = paragraphBreak + 2;
          } else {
            // Try to break at a sentence
            const sentenceBreak = content.lastIndexOf('. ', breakPoint);
            if (sentenceBreak > breakPoint * 0.7) {
              breakPoint = sentenceBreak + 2;
            }
          }
        }
        
        chunks.push(content.substring(0, breakPoint));
        content = content.substring(breakPoint);
      }
      
      // If we have multiple chunks, return a processed version
      if (chunks.length > 1) {
        return {
          role: message.role,
          content: chunks[chunks.length - 1] + 
                  `\n\n[Note: This is part ${chunks.length} of a ${chunks.length}-part message.]`
        };
      }
    }
    
    return message;
  });
}

/**
 * Generate a streaming chat completion using Grok
 * 
 * @param messages Array of messages in the conversation
 * @param onChunk Callback function for each chunk of the stream
 * @param options Optional parameters for the completion
 */
export async function generateStreamingChatResponse(
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  options: ChatOptions = {}
): Promise<{ content: string }> {
  // Process messages to ensure they're not too long for Grok
  const processedMessages = preprocessMessages(messages);
  
  // Default timeout of 75 seconds (can be overridden)
  const timeoutMs = options.timeoutMs || 75000;
  
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
  const keepaliveThresholdMs = 5000; // 5 seconds
  
  // Maximum retries for transient errors
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let streamClosed = false;
  let fullResponse = '';
  
  // Track streaming progress
  let totalChunks = 0;
  const lastActivityTime = Date.now();
  
  // Function to process chunks from the stream
  const processStream = async (reader: ReadableStreamDefaultReader<Uint8Array>, decoder: TextDecoder) => {
    try {
      while (!streamClosed) {
        const { done, value } = await reader.read();
        if (done) {
          streamClosed = true;
          break;
        }
        
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
            if (data === '[DONE]') {
              streamClosed = true;
              continue;
            }
            
            try {
              const parsedData = JSON.parse(data);
              const content = parsedData.choices[0]?.delta?.content || '';
              if (content) {
                hasContent = true;
                fullResponse += content;
                totalChunks++;
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
        
        // Check if we're potentially hitting model limits (many tokens without completion)
        if (totalChunks > 500 && (Date.now() - lastActivityTime > 20000)) {
          onChunk('\n\n[Note: This response is quite long and may be approaching model limits.]');
          
          // Force a stream reset if we've been generating for a long time
          if (fullResponse.length > 12000) {
            break;
          }
        }
      }
    } catch (error) {
      // Handle stream processing errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error; // Let the main try/catch handle abort errors
      }
      
      // For other errors during stream processing, attempt to retry if we haven't hit max retries
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        onChunk(`\n\n[Connection interrupted. Retrying... (${retryCount}/${MAX_RETRIES})]`);
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        return false; // Signal to retry
      } else {
        throw error; // Let the main try/catch handle it after max retries
      }
    }
    
    return true; // Success - no need to retry
  };
  
  // Main API call and stream processing loop
  try {
    // Function to check if we need a keepalive
    const checkKeepAlive = () => {
      const now = Date.now();
      if (now - lastContentTime > keepaliveThresholdMs) {
        // Send empty keepalive to client to keep connection alive
        onChunk('');
        lastContentTime = now;
      }
    };
    
    // Set up keepalive interval (more frequent checks)
    const keepaliveInterval = setInterval(checkKeepAlive, 2000); // Check every 2 seconds
    
    let success = false;
    while (!success && retryCount <= MAX_RETRIES) {
      try {
        // Add a custom HTTP header to disable compression which can help with streaming
        const customHeaders = {
          'Accept-Encoding': 'identity', // Disable compression for streaming
          'Cache-Control': 'no-cache',
          'X-Request-Type': 'streaming'
        };
        
        // Make the API request for streaming with shorter timeouts for initial response
        const response = await grok.request('/chat/completions', {
          method: 'POST',
          body: JSON.stringify({
            model: aiConfig.modelConfig.chatModel,
            messages: processedMessages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens || 4000, // Set explicit max tokens
            stream: true,
          }),
          headers: customHeaders,
          signal,
          timeoutMs: 30000, // Use a shorter timeout for initial response
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response from Grok API: ${response.status}`, errorText);
          throw new Error(`Grok API error: ${response.status}`);
        }
        
        // Create a reader from the response body stream
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        
        // Process the stream
        success = await processStream(reader, decoder);
        
        // If processing was successful, break the retry loop
        if (success) break;
      } catch (error) {
        // If it's an abort error or we've hit max retries, throw
        if (
          (error instanceof DOMException && error.name === 'AbortError') || 
          retryCount >= MAX_RETRIES
        ) {
          throw error;
        }
        
        // Otherwise increment retry counter and try again
        retryCount++;
        const waitTime = 1000 * retryCount;
        console.error(`Stream error, retrying (${retryCount}/${MAX_RETRIES}) after ${waitTime}ms:`, error);
        onChunk(`\n\n[Connection error. Retrying... (${retryCount}/${MAX_RETRIES})]`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    return { content: fullResponse };
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
  } finally {
    // Clean up
    clearTimeout(timeoutId);
  }
}
