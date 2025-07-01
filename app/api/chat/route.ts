import { SYSTEM_PROMPT, PERSONA_PROMPTS } from "@/lib/ai/prompts";
import {
  streamWithGrok,
  streamWithGrokSearch,
  streamWithTavilyEnhancedGrok,
} from "@/lib/search/providers";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    persona = "tutor",
    useWebSearch = false,
  } = await req.json();

  console.log(
    `\n⚠️ Chat API - useWebSearch: ${useWebSearch}, persona: ${persona}`
  );

  const personaPrompt =
    PERSONA_PROMPTS[persona as keyof typeof PERSONA_PROMPTS] || "";

  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${personaPrompt}`;

  // Extract the current user message for search context
  const currentMessage = messages[messages.length - 1]?.content || "";

  try {
    let result;

    if (useWebSearch) {
      console.log(
        `✅ Using Tavily-enhanced search for query: ${currentMessage}\n`
      );
      // Use Tavily for enhanced web search
      result = await streamWithTavilyEnhancedGrok(
        messages,
        fullSystemPrompt,
        currentMessage
      );
    } else {
      console.log(`✅ Using regular Grok without web search\n`);
      // Use regular Grok without web search
      result = await streamWithGrok(messages, fullSystemPrompt);
    }

    return result.toDataStreamResponse();
  } catch (error) {
    console.error(`\n⛔ Chat API error: ${error}\n`);

    // Fallback to Grok with built-in search if Tavily fails
    try {
      const fallbackResult = await streamWithGrokSearch(
        messages,
        fullSystemPrompt
      );
      return fallbackResult.toDataStreamResponse();
    } catch (fallbackError) {
      console.error(`\n⛔ Fallback search also failed: ${fallbackError}\n`);
      throw new Error("Both primary and fallback search methods failed");
    }
  }
}
