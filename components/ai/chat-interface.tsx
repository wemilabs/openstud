"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Send, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ai/chat-message";
import {
  sendMessageStream,
  getConversationById,
  cancelChatStreamById,
} from "@/actions/ai-chat";
import { type ChatMessage as ChatMessageType } from "@/lib/ai";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("id");

  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      role: "system",
      content:
        "You are Clever, a helpful AI tutor for OpenStud. You help students understand concepts, explain topics, suggest exercises, and assist with their academic needs. You can also create study plans and manage their academic progress, understand their needs, and provide guidance based on their goals.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load a conversation by ID
  const loadConversation = useCallback(async (id: string) => {
    setIsLoadingConversation(true);
    try {
      const { conversation, error } = await getConversationById(id);

      if (error || !conversation) {
        console.error("Error loading conversation:", error);
        toast.error("Failed to load conversation");
        // Redirect to new conversation if the requested one doesn't exist
        router.push("/dashboard/ai-tutor");
        return;
      }

      // Reset messages and add conversation messages
      setMessages([
        {
          role: "system",
          content:
            "You are Clever, a helpful AI tutor for OpenStud. You help students understand concepts, explain topics, suggest exercises, and assist with their academic needs. You can also create study plans and manage their academic progress, understand their needs, and provide guidance based on their goals.",
        },
        ...conversation.messages.map((msg: any) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        })),
      ]);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
      // Redirect to new conversation if there's an error
      router.push("/dashboard/ai-tutor");
    } finally {
      setIsLoadingConversation(false);
    }
  }, [router]);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      setCurrentConversationId(conversationId);
    } else {
      // Reset to default state for new conversation
      setMessages([
        {
          role: "system",
          content:
            "You are Clever, a helpful AI tutor for OpenStud. You help students understand concepts, explain topics, suggest exercises, and assist with their academic needs. You can also create study plans and manage their academic progress, understand their needs, and provide guidance based on their goals.",
        },
      ]);
      setCurrentConversationId(null);
    }
  }, [conversationId, loadConversation]);

  // Scroll to bottom when messages change or streaming message updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle stopping the current AI response
  const handleStopResponse = async () => {
    if (!currentConversationId) return;

    // Abort the fetch request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    try {
      const result = await cancelChatStreamById(currentConversationId);

      if (result.success) {
        // If we have a partial streaming message, save it as the final response
        if (streamingMessage) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: streamingMessage,
            },
          ]);
          setStreamingMessage("");
        }

        setIsLoading(false);
        toast.info("Response generation stopped");
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error stopping response:", error);
      toast.error("Failed to stop response");
    }
  };

  // Process the streaming response
  const processStream = async (stream: ReadableStream<Uint8Array>) => {
    try {
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      // Reset streaming message
      setStreamingMessage("");

      // Buffer to accumulate text that might contain metadata
      let metadataBuffer = "";
      let newConversationId: string | undefined;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });

        // Check if the chunk contains metadata (at the end of the stream)
        if (chunk.includes('{"__metadata":')) {
          // Extract the metadata part
          const metadataParts = chunk.split("\n");

          // The last part should contain our metadata
          for (const part of metadataParts) {
            if (part.includes('{"__metadata":')) {
              try {
                const metadata = JSON.parse(part);
                if (metadata.__metadata?.conversationId) {
                  newConversationId = metadata.__metadata.conversationId;
                }
                // Don't add this part to the streaming message
                continue;
              } catch (e) {
                console.error("Error parsing metadata:", e);
              }
            }

            // Add non-metadata parts to the streaming message
            if (part.trim()) {
              setStreamingMessage((prev) => prev + part);
            }
          }
        } else {
          // Regular content chunk, add to the streaming message
          setStreamingMessage((prev) => prev + chunk);
        }
      }

      // When stream is complete, add the final message to the chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: streamingMessage,
        },
      ]);

      // Clear the streaming message after updating messages
      setStreamingMessage("");

      // Update the URL if we have a new conversation ID
      if (newConversationId && !currentConversationId) {
        setCurrentConversationId(newConversationId);
        // Use replace instead of push to avoid refreshing the page
        router.replace(`/dashboard/ai-tutor?id=${newConversationId}`, {
          scroll: false,
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log("Stream reading was aborted");
      } else {
        console.error("Error processing stream:", error);
        toast.error("Error processing response");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to the chat
    const userMessage: ChatMessageType = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingMessage(""); // Reset streaming message

    try {
      // Prepare messages to send (including system message)
      const messagesToSend = [...messages, userMessage];

      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Get the response as a stream
      const response = await sendMessageStream(
        messagesToSend,
        currentConversationId || undefined
      );

      // Process the stream
      await processStream(response);
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
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

  // Check if this is a new conversation with only the system message
  const isNewConversation =
    messages.length === 1 && messages[0].role === "system";

  return (
    <div className="flex flex-col h-full">
      {isNewConversation && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-280px)] md:min-h-[calc(100vh-340px)] gap-8">
          <h1 className="text-3xl font-bold text-center">
            What do you have to learn about today?
          </h1>
          <div className="w-full max-w-xl px-4">
            <div className="relative">
              <Textarea
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] max-h-[120px] resize-none pr-12 rounded-2xl bg-muted/50 border border-input shadow-sm focus-visible:ring-1"
                disabled={isLoading}
              />
              <div className="absolute right-3 bottom-3">
                {isLoading ? (
                  <Button
                    onClick={handleStopResponse}
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-xl bg-destructive text-white shadow-sm hover:bg-destructive/90 cursor-pointer"
                    title="Stop generating"
                  >
                    <StopCircle className="size-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim()}
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-xl bg-blue-500 text-white shadow-sm hover:bg-blue-500/90 cursor-pointer"
                  >
                    <Send className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {(!isNewConversation || isLoading) && (
        <>
          <div className="h-[calc(100vh-200px)] overflow-y-auto pb-32">
            <div className="max-w-3xl mx-auto">
              <div className="space-y-4 p-4">
                {messages
                  .filter((msg) => msg.role !== "system")
                  .map((message, index) => (
                    <ChatMessage key={index} message={message} />
                  ))}

                {isLoading && streamingMessage && (
                  <ChatMessage
                    message={{
                      role: "assistant",
                      content: streamingMessage,
                    }}
                    isStreaming={true}
                  />
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 md:left-[220px] bg-background/80 backdrop-blur-sm shadow-md">
            <div className="max-w-2xl mx-auto p-4">
              <div className="relative">
                <Textarea
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[60px] max-h-[120px] resize-none pr-12 rounded-2xl bg-muted/50 border border-input shadow-sm focus-visible:ring-1"
                  disabled={isLoading}
                />
                <div className="absolute right-3 bottom-3">
                  {isLoading ? (
                    <Button
                      onClick={handleStopResponse}
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-xl bg-destructive text-white shadow-sm hover:bg-destructive/90 cursor-pointer"
                      title="Stop generating"
                    >
                      <StopCircle className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim()}
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    >
                      <Send className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
