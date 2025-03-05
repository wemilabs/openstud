"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ai/chat-message";
import { sendMessage, getConversationById } from "@/actions/ai-chat";
import { type ChatMessage as ChatMessageType } from "@/lib/ai";

export function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("id");

  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      role: "system",
      content:
        "You are Gust, a helpful AI tutor for OpenStud. You help students understand concepts, explain topics, suggest exercises, and assist with their academic needs. You can also create study plans and manage their academic progress, understand their needs, and provide guidance based on their goals.",
    },
    {
      role: "assistant",
      content:
        "Hello! I'm Gust. I can help you throughout your academic journey. What would you like help with today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation if ID is provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load a conversation by ID
  const loadConversation = async (id: string) => {
    setIsLoadingConversation(true);
    try {
      const { conversation, error } = await getConversationById(id);

      if (error || !conversation) {
        console.error("Error loading conversation:", error);
        return;
      }

      // Reset messages and add conversation messages
      setMessages([
        {
          role: "system",
          content:
            "You are Gust, a helpful AI tutor for OpenStud. You help students understand concepts, explain topics, suggest exercises, and assist with their academic needs. You can also create study plans and manage their academic progress, understand their needs, and provide guidance based on their goals.",
        },
        ...conversation.messages.map((msg: any) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
      ]);
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to the chat
    const userMessage: ChatMessageType = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare messages to send (including system message)
      const messagesToSend = [...messages, userMessage];

      // Send message to the AI
      const { response, error } = await sendMessage(
        messagesToSend,
        conversationId || undefined
      );

      if (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ]);
        return;
      }

      // Add AI response to the chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            response || "Sorry, I encountered an error. Please try again.",
        },
      ]);

      // Update URL with conversation ID if not already set
      if (!conversationId && response) {
        // Note: In a real implementation, we would get the conversation ID from the response
        // For now, we'll just refresh the page to get the updated conversations
        router.refresh();
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoadingConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages
            .filter((msg) => msg.role !== "system")
            .map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Textarea
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="h-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
