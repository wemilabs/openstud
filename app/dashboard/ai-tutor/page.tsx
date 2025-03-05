/**
 * AI Tutor Page
 *
 * Main page for interacting with the AI tutor
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllConversations } from "@/actions/ai-chat";
import { ChatInterface } from "@/components/ai/chat-interface";
import { ConversationList } from "@/components/ai/conversation-list";

export const metadata: Metadata = {
  title: "Gust AI | OpenStud",
  description:
    "Get personalized help with your studies from the OpenStud AI Tutor",
};

export default async function AITutorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get all conversations for the user
  const { conversations, error } = await getAllConversations();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with conversation history */}
        <div className="w-64 border-r border-border bg-card hidden md:block overflow-y-auto">
          <ConversationList conversations={conversations || []} />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
