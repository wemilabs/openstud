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
      signal: options.signal,
    });

    // Create a reader from the response body stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    // Read the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Decode the chunk
      const chunk = decoder.decode(value, { stream: true });
      
      // Process each line (each SSE event)
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          // Skip the [DONE] message
          if (data === '[DONE]') continue;
          
          try {
            const parsedData = JSON.parse(data);
            const content = parsedData.choices[0]?.delta?.content || '';
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating streaming chat completion:', error);
    // Rethrow AbortError so it can be handled properly
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new Error('Failed to generate streaming AI response');
  }
}
