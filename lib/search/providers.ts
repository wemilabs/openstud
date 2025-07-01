import { createXai } from "@ai-sdk/xai";
import { streamText, StreamTextResult } from "ai";
import { tavily } from "@tavily/core";

export interface SearchContext {
  query: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
  }>;
}

/**
 * Performs a web search using Tavily API
 */
export async function searchWithTavily(query: string): Promise<SearchContext> {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is not configured");
  }

  try {
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

    const response = await tvly.search(query, {
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: true,
      max_results: 10,
    });

    return {
      query,
      results: response.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content || result.raw_content || "",
      })),
    };
  } catch (error) {
    console.error("Tavily search error:", error);
    throw new Error(`Tavily search failed: ${error}`);
  }
}

/**
 * Uses Grok's built-in web search capabilities
 */
export async function streamWithGrokSearch(
  messages: any[],
  systemPrompt: string
): Promise<StreamTextResult<Record<string, any>, Record<string, any>>> {
  if (!process.env.GROK_API_KEY) {
    throw new Error("GROK_API_KEY is not configured");
  }

  const xai = createXai({
    apiKey: process.env.GROK_API_KEY!,
    baseURL: process.env.GROK_API_BASE_URL!,
  });

  return streamText({
    model: xai(process.env.GROK_AI_CHAT_MODEL! || "grok-3-fast-latest"),
    system: systemPrompt,
    messages,
    providerOptions: {
      xai: {
        searchParameters: {
          mode: "auto",
          returnCitations: true,
          sources: [{ type: "web" }, { type: "x" }],
          maxSearchResults: 10,
        },
      },
    },
  });
}

/**
 * Uses Grok without web search for regular conversations
 */
export async function streamWithGrok(
  messages: any[],
  systemPrompt: string
): Promise<StreamTextResult<Record<string, any>, Record<string, any>>> {
  if (!process.env.GROK_API_KEY) {
    throw new Error("GROK_API_KEY is not configured");
  }

  const xai = createXai({
    apiKey: process.env.GROK_API_KEY!,
    baseURL: process.env.GROK_API_BASE_URL!,
  });

  return streamText({
    model: xai(process.env.GROK_AI_CHAT_MODEL! || "grok-3-fast-latest"),
    system: systemPrompt,
    messages,
  });
}

/**
 * Enhanced search using Tavily + Grok combination
 */
export async function streamWithTavilyEnhancedGrok(
  messages: any[],
  systemPrompt: string,
  query: string
): Promise<StreamTextResult<Record<string, any>, Record<string, any>>> {
  try {
    // Step 1: Get fresh search results from Tavily
    const searchContext = await searchWithTavily(query);

    // Step 2: Create enhanced system prompt with search context
    const searchResults = searchContext.results
      .slice(0, 5) // Limit to top 5 results to avoid token limits
      .map(
        (result, index) =>
          `[${index + 1}] ${result.title}\nURL: ${
            result.url
          }\nContent: ${result.content.substring(0, 500)}...\n`
      )
      .join("\n");

    const enhancedSystemPrompt = `${systemPrompt}

CURRENT SEARCH CONTEXT (Fresh data from Tavily):
Query: ${query}

Recent search results:
${searchResults}

Please use this fresh information to provide accurate, up-to-date responses. Always cite sources when using information from the search results.`;

    // Step 3: Stream response using Grok with enhanced context
    return streamWithGrok(messages, enhancedSystemPrompt);
  } catch (error) {
    console.error("Tavily-enhanced Grok search error:", error);
    // Fallback to regular Grok with search if Tavily fails
    return streamWithGrokSearch(messages, systemPrompt);
  }
}
