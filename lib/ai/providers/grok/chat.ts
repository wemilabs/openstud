/**
 * Grok Chat Implementation
 *
 * Handles chat completions using Grok's API
 */

import { grok } from "./index";
import { aiConfig } from "../../config";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
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
    const response = await grok.request("/chat/completions", {
      method: "POST",
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
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error generating chat completion:", error);
    // Rethrow AbortError so it can be handled properly
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new Error("Failed to generate AI response");
  }
}

/**
 * Split long messages for better streaming performance with Grok
 * Grok can sometimes have issues with very long messages
 */
function preprocessMessages(messages: ChatMessage[]): ChatMessage[] {
  const MAX_MESSAGE_LENGTH = 6000; // Characters per message chunk

  return messages.map((message) => {
    // Only process long user or system messages
    if (
      (message.role === "user" || message.role === "system") &&
      message.content.length > MAX_MESSAGE_LENGTH
    ) {
      // Split the message content into reasonable chunks
      const chunks = [];
      let content = message.content;

      while (content.length > 0) {
        // Find a good breaking point (sentence or paragraph end)
        let breakPoint = Math.min(MAX_MESSAGE_LENGTH, content.length);

        if (breakPoint < content.length) {
          // Try to break at a paragraph
          const paragraphBreak = content.lastIndexOf("\n\n", breakPoint);
          if (paragraphBreak > breakPoint * 0.7) {
            breakPoint = paragraphBreak + 2;
          } else {
            // Try to break at a sentence
            const sentenceBreak = content.lastIndexOf(". ", breakPoint);
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
          content:
            chunks[chunks.length - 1] +
            `\n\n[Note: This is part ${chunks.length} of a ${chunks.length}-part message.]`,
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
  const timeoutMs = options.timeoutMs || 180000; // Increased to 3 minutes default

  // Create an abort controller for the timeout
  const abortController = new AbortController();
  
  // Set up a properly working abort system that handles both user abort and timeout
  const userSignal = options.signal;
  
  // Listen for abort signals from the user's AbortController
  if (userSignal) {
    // If the user signal is already aborted, abort immediately
    if (userSignal.aborted) {
      abortController.abort();
    } else {
      // Otherwise, listen for when it gets aborted
      userSignal.addEventListener('abort', () => {
        console.log("User aborted the request");
        abortController.abort();
      }, { once: true });
    }
  }

  // Track when we last received content
  let lastContentTime = Date.now();
  // If we haven't received content for this long, send keepalive
  const keepaliveThresholdMs = 5000; // 5 seconds

  // Maximum retries for transient errors
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let streamClosed = false;
  let fullResponse = "";

  // Track streaming progress
  let totalChunks = 0;
  const lastActivityTime = Date.now();

  // Set up timeout for the request
  const timeoutId = setTimeout(() => {
    console.log(`Request timed out after ${timeoutMs}ms`);
    abortController.abort();
  }, timeoutMs);

  // Initialize with dummy timeout that we'll overwrite
  let keepaliveInterval: NodeJS.Timeout = setTimeout(() => {}, 0);

  // Function to process chunks from the stream
  const processStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ) => {
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
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        let hasContent = false;
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            // Skip the [DONE] message
            if (data === "[DONE]") {
              streamClosed = true;
              continue;
            }

            try {
              const parsedData = JSON.parse(data);
              const content = parsedData.choices[0]?.delta?.content || "";
              if (content) {
                hasContent = true;
                fullResponse += content;
                totalChunks++;
                onChunk(content);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
              // Continue processing other lines even if one fails
            }
          }
        }
      }
    } catch (error) {
      // Handle stream processing errors
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error; // Let the main try/catch handle abort errors
      }

      // For other errors during stream processing, attempt to retry if we haven't hit max retries
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        onChunk(
          `\n\n[Connection interrupted. Retrying... (${retryCount}/${MAX_RETRIES})]`
        );
        // Wait a moment before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
        return false; // Signal to retry
      } else {
        throw error; // Let the main try/catch handle it after max retries
      }
    } finally {
      // Properly release the reader to avoid resource leaks
      try {
        await reader.cancel();
      } catch (e) {
        console.error("Error cancelling reader:", e);
      }
    }

    return true; // Success - no need to retry
  };

  // Main API call and stream processing loop
  try {
    // Function to check if we need a keepalive
    const checkKeepAlive = () => {
      if (streamClosed) return;
      
      const now = Date.now();
      if (now - lastContentTime > keepaliveThresholdMs) {
        // Send empty keepalive to client to keep connection alive
        onChunk("");
        lastContentTime = now;
      }
    };

    // Set up keepalive interval (more frequent checks)
    keepaliveInterval = setInterval(checkKeepAlive, 2000); // Check every 2 seconds

    let success = false;
    while (!success && retryCount <= MAX_RETRIES) {
      try {
        // Add a custom HTTP header to disable compression which can help with streaming
        const customHeaders = {
          "Accept-Encoding": "identity", // Disable compression for streaming
          "Cache-Control": "no-cache",
          "X-Request-Type": "streaming",
        };

        // Make the API request for streaming
        const response = await grok.request("/chat/completions", {
          method: "POST",
          body: JSON.stringify({
            model: aiConfig.modelConfig.chatModel,
            messages: processedMessages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens || 8000, // Increased max tokens to allow for longer responses
            stream: true,
          }),
          headers: customHeaders,
          signal: abortController.signal, // Use our combined signal
          timeoutMs, // Use the full timeout for the request
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Error response from Grok API: ${response.status}`,
            errorText
          );
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
          (error instanceof DOMException && error.name === "AbortError") ||
          retryCount >= MAX_RETRIES
        ) {
          throw error;
        }

        // Otherwise increment retry counter and try again
        retryCount++;
        const waitTime = 1000 * retryCount;
        console.error(
          `Stream error, retrying (${retryCount}/${MAX_RETRIES}) after ${waitTime}ms:`,
          error
        );
        onChunk(
          `\n\n[Connection error. Retrying... (${retryCount}/${MAX_RETRIES})]`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    return { content: fullResponse };
  } catch (error) {
    console.error("Error generating streaming chat completion:", error);

    // Check if it's a timeout error or AbortError
    if (error instanceof DOMException && error.name === "AbortError") {
      // Check if it was aborted by the user or by the timeout
      if (userSignal && userSignal.aborted) {
        // This was user-initiated
        onChunk("\n\n[Generation stopped by user]");
      } else {
        // This was a timeout
        onChunk("\n\n[Generation timed out. The response may be incomplete.]");
      }
      
      // Return what we have so far
      return { content: fullResponse };
    }

    // Check for more generic streaming errors that might be happening in production
    if (fullResponse.length > 0) {
      console.log("Stream error occurred but we have partial content, returning it");
      onChunk("\n\n[Error occurred. Returning partial response.]");
      return { content: fullResponse };
    }

    // For other errors with no content, also try to notify the client
    onChunk("\n\n[Error occurred during generation. The response may be incomplete.]");
    throw new Error("Failed to generate streaming AI response");
  } finally {
    // Clean up
    clearTimeout(timeoutId);
    clearInterval(keepaliveInterval); // Make sure to clear the keepalive interval
  }
}
