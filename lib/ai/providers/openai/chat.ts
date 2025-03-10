/**
 * OpenAI Chat Implementation
 *
 * Handles chat completions using OpenAI's API
 */

import { openai } from "./index";
import { aiConfig } from "../../config";
import { ChatCompletionMessageParam } from "openai/resources/chat";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  signal?: AbortSignal;
}

/**
 * Generate a chat completion using OpenAI
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
    const response = await openai.chat.completions.create({
      model: aiConfig.modelConfig.chatModel,
      messages: messages as ChatCompletionMessageParam[],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: false,
    });

    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Error generating chat completion:", error);
    throw new Error("Failed to generate AI response");
  }
}

/**
 * Generate a streaming chat completion using OpenAI
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
    const stream = await openai.chat.completions.create({
      model: aiConfig.modelConfig.chatModel,
      messages: messages as ChatCompletionMessageParam[],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        onChunk(content);
      }
    }
  } catch (error) {
    console.error("Error generating streaming chat completion:", error);
    throw new Error("Failed to generate streaming AI response");
  }
}
