import { Metadata } from "next";
import { notFound } from "next/navigation";

import { PersonaType } from "@/lib/actions/ai-convo";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/prisma";

import { ChatUI } from "@/components/dashboard/ask-qlever/chat-ui";
import { ChatHistory } from "@/components/dashboard/ask-qlever/chat-history";

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
};

type Conversation = {
  id: string;
  title: string | null;
  persona: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
};

export const metadata: Metadata = {
  title: "Chat with Qlever | OpenStud",
  description: "Get answers to your academic questions from Qlever AI",
};

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return notFound();
  }

  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const useWebSearch = resolvedSearchParams?.useWebSearch === "true";

  const conversation = (await prisma.aIConversation.findUnique({
    where: {
      id,
      createdById: session.user.id,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
  })) as Conversation | null;

  if (!conversation) {
    return notFound();
  }

  return (
    <section className="flex flex-col">
      <div className="flex items-center justify-end -mt-2 pr-9">
        <ChatHistory currentId={id} />
      </div>

      <div className="flex-1 px-4 py-2 md:px-8">
        <ChatUI
          conversationId={id}
          initialMessages={conversation.messages.map(
            ({ id, role, content }) => ({
              id,
              role: role as "user" | "assistant",
              content,
            })
          )}
          persona={conversation.persona as PersonaType}
          useWebSearch={useWebSearch}
        />
      </div>
    </section>
  );
}
