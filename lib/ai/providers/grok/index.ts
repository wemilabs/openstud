/**
 * Grok Provider
 *
 * This file exports the Grok client and related utilities.
 */

import { grokConfig } from "../../config";

// Special timeout for fetch that doesn't rely on the global AbortController
const fetchWithTimeout = async (url: string, options: RequestInit & { timeoutMs?: number }) => {
  const { timeoutMs = 60000, ...fetchOptions } = options;
  
  // Create an abort controller specifically for this request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    // Combine the request's abort signal with our timeout signal
    const origSignal = fetchOptions.signal;
    
    // Create a new options object with our abort controller's signal
    const newOptions = {
      ...fetchOptions,
      signal: controller.signal,
    };
    
    // If the original request had a signal, we need to handle that too
    if (origSignal) {
      // If the original signal aborts, we should abort our controller too
      const origAbortHandler = () => {
        controller.abort();
      };
      
      // Add the handler to the original signal
      origSignal.addEventListener('abort', origAbortHandler);
    }
    
    // Make the fetch request
    const response = await fetch(url, newOptions);
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Define the Grok client class
class GrokClient {
  private apiKey: string;
  private baseUrl: string = "https://api.x.ai/v1";
  private defaultTimeoutMs: number = 60000; // 60 seconds default timeout

  constructor(options: { apiKey: string; timeoutMs?: number }) {
    this.apiKey = options.apiKey;
    if (options.timeoutMs) {
      this.defaultTimeoutMs = options.timeoutMs;
    }
  }

  /**
   * Helper method to make API requests to Grok
   */
  async request(endpoint: string, options: RequestInit & { timeoutMs?: number } = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Set timeout - use provided timeout or default
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    try {
      // Use our custom fetchWithTimeout
      const response = await fetchWithTimeout(url, {
        ...options,
        headers,
        timeoutMs,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Grok API error: Status ${response.status}`;
        
        try {
          // Try to parse the error as JSON
          const errorJson = JSON.parse(errorText);
          errorMessage = `Grok API error: ${errorJson.error || errorJson.message || response.statusText}`;
        } catch (e) {
          // If not JSON, use as is
          if (errorText) {
            errorMessage = `Grok API error: ${errorText}`;
          }
        }
        
        console.error(`Grok API request failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      // Enhance error information
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`Grok request timeout after ${timeoutMs}ms: ${endpoint}`);
          throw new Error(`Request timed out after ${timeoutMs}ms`);
        }
        
        // Check if it's a network error (no internet)
        if (!navigator.onLine) {
          console.error('Network is offline. Cannot make request to Grok API.');
          throw new Error('Network connection unavailable');
        }
        
        console.error(`Grok request error: ${error.message}`);
      }
      
      throw error;
    }
  }
}

// Initialize the Grok client
export const grok = new GrokClient({
  apiKey: grokConfig.apiKey || "",
  timeoutMs: parseInt(process.env.GROK_REQUEST_TIMEOUT_MS || '60000', 10),
});
