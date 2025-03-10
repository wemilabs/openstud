/**
 * Grok Provider
 *
 * This file exports the Grok client and related utilities.
 */

import { grokConfig } from "../../config";

// Define the Grok client class
class GrokClient {
  private apiKey: string;
  private baseUrl: string = "https://api.x.ai/v1";

  constructor(options: { apiKey: string }) {
    this.apiKey = options.apiKey;
  }

  /**
   * Helper method to make API requests to Grok
   */
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(`Grok API error: ${error.error || response.statusText}`);
    }

    return response;
  }
}

// Initialize the Grok client
export const grok = new GrokClient({
  apiKey: grokConfig.apiKey || "",
});
