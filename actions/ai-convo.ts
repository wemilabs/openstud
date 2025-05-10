"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// TODO: Fix this weird behavior where when ai will generate a first response, if we reload or get back later to this very convo, it will render the ai response twice (or more) again.

export async function createNewConversation(query: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  let conversationId: string;

  try {
    const conversation = await prisma.aIConversation.create({
      data: {
        title: query.slice(0, 100),
        createdById: session.user.id,
        messages: {
          create: {
            role: "user",
            content: query,
          },
        },
      },
    });

    conversationId = conversation.id;

    revalidatePath("/dashboard/ask-clever");
    revalidatePath(`/dashboard/ask-clever/chat/${conversationId}`);
  } catch (error) {
    console.error("Error creating conversation:", error);

    redirect("/dashboard/ask-clever?error=creation_failed");
  }

  redirect(`/dashboard/ask-clever/chat/${conversationId}`);
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
  role: string,
  content: string
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
      },
    });

    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    revalidatePath(`/dashboard/ask-clever/chat/${conversationId}`);
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

    revalidatePath("/dashboard/ask-clever");
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw new Error("Failed to delete conversation");
  }
}
