"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/prisma";
import { createXai } from "@ai-sdk/xai";
import { streamText, generateText } from "ai";

export type PersonaType =
  | "tutor"
  | "study-buddy"
  | "writing-assistant"
  | "project-helper";

async function generateAIConversationTitle(message: string): Promise<string> {
  try {
    const xai = createXai({
      apiKey: process.env.GROK_API_KEY!,
      baseURL: process.env.GROK_API_BASE_URL!,
    });

    const result = await generateText({
      model: xai(process.env.GROK_AI_CHAT_MODEL! || "grok-3-mini-fast-latest"),
      system:
        "Generate a very short, concise title (ensure it is not more than 80 characters long) that summarizes the first message a user begins a conversation with. Just return the title. No quotes, colons or formatting.",
      messages: [
        {
          role: "user" as const,
          content: `Generate a title for this message: ${message}`,
        },
      ],
    });

    return result.text || "New conversation";
  } catch (error) {
    console.error("Error generating AI title:", error);
    // Fallback to first 50 chars of the message
    return message.trim().substring(0, 50) || "New conversation";
  }
}

export async function createNewConversation({
  query,
  persona,
}: {
  query: string;
  persona: PersonaType;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  let conversationId: string;

  try {
    const conversation = await prisma.aIConversation.create({
      data: {
        title: await generateAIConversationTitle(query),
        persona,
        messages: {
          create: {
            role: "user",
            content: query,
            persona,
          },
        },
        createdById: session.user.id,
      },
    });

    conversationId = conversation.id;
  } catch (error) {
    console.error("Error creating conversation:", error);
    redirect("/dashboard/ask-qlever?error=creation_failed");
  }

  redirect(`/dashboard/ask-qlever/chat/${conversationId}`);
}

export async function getAllConversations() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  try {
    const conversations = await prisma.aIConversation.findMany({
      where: {
        createdById: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    return conversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

export async function addMessageToConversation(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  persona: PersonaType
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const conversation = await prisma.aIConversation.findUnique({
      where: {
        id: conversationId,
        createdById: session.user.id,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        ...(persona && { persona }),
      },
    });

    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  } catch (error) {
    console.error("Error adding message:", error);
    throw new Error("Failed to add message");
  }
}

export async function deleteConversation(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  try {
    const conversation = await prisma.aIConversation.findUnique({
      where: {
        id: conversationId,
        createdById: session.user.id,
      },
    });

    if (!conversation) {
      throw new Error(
        "Conversation not found or user does not have permission"
      );
    }

    await prisma.aIConversation.delete({
      where: {
        id: conversationId,
      },
    });

    revalidatePath("/dashboard/ask-qlever");
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw new Error("Failed to delete conversation");
  }
}
