import { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { ChatUI } from "@/components/dashboard/ask-clever/chat-ui";
import { ChatHistory } from "@/components/dashboard/ask-clever/chat-history";
import { PersonaType } from "@/lib/actions/ai-convo";

export const metadata: Metadata = {
  title: "Chat with Clever | OpenStud",
  description: "Get answers to your academic questions from Clever AI",
};

export default async function ChatPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return notFound();
  }

  const { id } = await params;

  const conversation = await prisma.aIConversation.findUnique({
    where: {
      id,
      createdById: session.user.id,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

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
        />
      </div>
    </section>
  );
}
