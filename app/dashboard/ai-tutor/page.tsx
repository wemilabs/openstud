import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllConversations } from "@/actions/ai-chat";
import { ChatInterface } from "@/components/ai/chat-interface";
import { ChatListButton } from "@/components/ai/chat-list-button";
import { NewChatButton } from "@/components/ai/new-chat-button";

export const metadata: Metadata = {
  title: "Chat with Cleverness | OpenStud",
  description:
    "Get personalized help with your studies from the OpenStud AI Tutor, Cleverness",
};

export default async function AITutorPage() {
  // Check authentication first
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Get all conversations for the user
  const { conversations } = await getAllConversations();

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-4 px-4">
        <ChatListButton conversations={conversations || []} />
        <NewChatButton />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
