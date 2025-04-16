import { createXai } from "@ai-sdk/xai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const xai = createXai({
    apiKey: process.env.GROK_API_KEY!,
    baseURL: process.env.GROK_API_BASE_URL!,
  });

  const result = streamText({
    model: xai(process.env.GROK_AI_CHAT_MODEL! || "grok-3-mini-fast-latest"),
    messages,
  });

  return result.toDataStreamResponse();
}
