import { createXai } from "@ai-sdk/xai";
import { streamText } from "ai";

import { SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { PERSONA_PROMPTS } from "@/lib/ai/personas";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, persona = "tutor" /*context */ } = await req.json();
  const xai = createXai({
    apiKey: process.env.GROK_API_KEY!,
    baseURL: process.env.GROK_API_BASE_URL!,
  });

  // const userContext = `
  //   User's current courses: ${context?.courses?.join(", ") || "Not specified"}
  //   Upcoming deadlines: ${context?.upcomingDeadlines?.join(", ") || "None"}
  //   Recent tasks: ${context?.recentTasks?.join(", ") || "None"}
  // `;

  const personaPrompt =
    PERSONA_PROMPTS[persona as keyof typeof PERSONA_PROMPTS] || "";
  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n${personaPrompt}`;

  const result = streamText({
    model: xai(process.env.GROK_AI_CHAT_MODEL! || "grok-3-mini-fast-latest"),
    system: fullSystemPrompt,
    messages,
  });

  return result.toDataStreamResponse();
}
