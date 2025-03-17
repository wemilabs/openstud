"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader, Send, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/ai/chat-message";
import {
  sendMessageStream,
  getConversationById,
  cancelChatStreamById,
} from "@/actions/ai-chat";
import { type ChatMessage as ChatMessageType } from "@/lib/ai";
import { toast } from "sonner";

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

  // Track stream activity to detect stalled streams
  const lastActivityRef = useRef<number>(Date.now());
  const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamRetryCountRef = useRef<number>(0);
  const MAX_STREAM_RETRIES = 2;

  // Load a conversation by ID
  const loadConversation = useCallback(
    async (id: string) => {
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
    },
    [router]
  );

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
    // Use a small timeout to ensure the DOM has updated before scrolling
    // This helps ensure the scroll happens after the content is rendered
    const scrollTimer = setTimeout(() => {
      scrollToBottom();
    }, 10);

    return () => clearTimeout(scrollTimer);
  }, [messages, streamingMessage]);

  // Clean up abort controller and timeouts on unmount
  useEffect(() => {
    return () => {
      // Clean up abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clean up stream timeout
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
    };
  }, []);

  // Setup stream activity monitoring
  const setupStreamMonitoring = useCallback(() => {
    // Clear any existing timeout
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }

    // Reset activity timestamp
    lastActivityRef.current = Date.now();

    // Set up timeout to check for inactivity (30 seconds)
    streamTimeoutRef.current = setTimeout(() => {
      const inactiveTime = Date.now() - lastActivityRef.current;

      // If no activity for 30 seconds and still loading, assume the stream is stalled
      if (isLoading && inactiveTime > 30000) {
        console.warn(`Stream appears stalled (inactive for ${inactiveTime}ms)`);

        // Only retry if we haven't exceeded max retries
        if (streamRetryCountRef.current < MAX_STREAM_RETRIES) {
          streamRetryCountRef.current++;
          setStreamingMessage((prev) =>
            prev + `\n\n[Connection appears stalled. Attempting to recover... (${streamRetryCountRef.current}/${MAX_STREAM_RETRIES})]`
          );

          // Attempt to recover by finalizing what we have
          finalizeStreamedMessage();
        } else {
          // Max retries exceeded, just finalize what we have
          setStreamingMessage((prev) =>
            prev + "\n\n[Connection lost. The response may be incomplete.]"
          );
          finalizeStreamedMessage();
        }
      }
    }, 30000);
  }, [isLoading]);

  // Finalize the current streaming message and add it to chat history
  const finalizeStreamedMessage = useCallback(() => {
    if (streamingMessage.trim()) {
      // Add the current streaming content as the final message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: streamingMessage.trim(),
        },
      ]);

      // Clear streaming state
      setStreamingMessage("");
      setIsLoading(false);

      // Clean up
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [streamingMessage]);

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

      // Reset retry counter for this new stream
      streamRetryCountRef.current = 0;

      // Setup monitoring for this stream
      setupStreamMonitoring();

      let newConversationId: string | undefined;
      let accumulatedContent = ""; // Track full response content

      // Set timeout for the entire stream (2 minutes)
      const streamTimeout = setTimeout(() => {
        if (isLoading) {
          console.warn("Stream exceeded maximum time limit (2 minutes)");
          // Add a message about the timeout
          setStreamingMessage((prev) =>
            prev + "\n\n[Response generation timed out after 2 minutes. The response may be incomplete.]"
          );
          // Finalize what we have
          finalizeStreamedMessage();
        }
      }, 120000);

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Update activity timestamp
          lastActivityRef.current = Date.now();

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });

          // Don't add empty chunks (keepalives) to accumulated content
          if (chunk.trim()) {
            accumulatedContent += chunk;
          }

          // Check if chunk contains metadata (conversation ID)
          if (chunk.includes('{"__metadata":')) {
            try {
              // Extract the metadata part
              const metadataStr = chunk.substring(
                chunk.indexOf('{"__metadata":'),
                chunk.length
              );
              const metadata = JSON.parse(metadataStr);

              // Extract conversation ID
              if (metadata.__metadata?.conversationId) {
                newConversationId = metadata.__metadata.conversationId;
              }

              // Don't add this part to the streaming message
              const contentPart = chunk.substring(
                0,
                chunk.indexOf('{"__metadata":')
              );
              if (contentPart.trim()) {
                setStreamingMessage((prev) => prev + contentPart);
              }
            } catch (e) {
              console.error("Error parsing metadata:", e);
              // If parsing fails, just treat it as regular content
              setStreamingMessage((prev) => prev + chunk);
            }
          } else if (
            chunk.includes('[Connection interrupted') ||
            chunk.includes('[Connection error') ||
            chunk.includes('[Generation interrupted') ||
            chunk.includes('[Error occurred during generation')
          ) {
            // Special handling for error messages
            setStreamingMessage((prev) => prev + chunk);
            // Reset the stream monitoring since we've received an update
            setupStreamMonitoring();
          } else if (chunk.trim()) {
            // Regular content chunk, add to the streaming message
            setStreamingMessage((prev) => prev + chunk);
            // Reset the stream monitoring since we've received an update
            setupStreamMonitoring();
          } else {
            // Empty chunk (keepalive) - just update the activity timestamp
            // No need to update UI
          }
        }
      } finally {
        clearTimeout(streamTimeout);
      }

      // When stream is complete, ensure we add the final message to the chat history
      if (accumulatedContent.trim()) {
        // Clean metadata from the accumulated content
        let finalContent = accumulatedContent;
        if (finalContent.includes('{"__metadata":')) {
          finalContent = finalContent.substring(
            0,
            finalContent.indexOf('{"__metadata":')
          );
        }

        // Only add the message if there's actual content
        if (finalContent.trim()) {
          // Update the messages state with the final assistant response
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              role: "assistant",
              content: finalContent.trim(),
            },
          ]);
        }

        // Clear streaming message after adding to chat history
        setStreamingMessage("");
      }

      // Update the URL if we have a new conversation ID - using a setTimeout to avoid reload
      if (newConversationId && !currentConversationId) {
        setCurrentConversationId(newConversationId);

        // Use setTimeout to defer the URL update until after the state updates have been processed
        setTimeout(() => {
          window.history.replaceState(
            {},
            "",
            `/dashboard/ai-tutor?id=${newConversationId}`
          );
        }, 0);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        console.log("Stream reading was aborted");
      } else {
        console.error("Error processing stream:", error);
        setStreamingMessage((prev) =>
          prev + "\n\n[Error processing response. The response may be incomplete.]"
        );

        // If we have partial content, finalize it even on error
        if (streamingMessage.trim()) {
          finalizeStreamedMessage();
        } else {
          toast.error("Error processing response");
          setIsLoading(false);
        }
      }
    } finally {
      // Clean up resources
      setIsLoading(false);
      abortControllerRef.current = null;

      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to the chat
    const userMessage: ChatMessageType = { role: "user", content: input };

    // Use callback form to ensure we're working with the latest state
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Clear input and set loading state
    setInput("");
    setIsLoading(true);
    setStreamingMessage(""); // Reset streaming message

    try {
      // Prepare messages to send (including system message)
      // Important: Use the current messages state plus the new user message
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

      // Use callback form to ensure we're working with the latest state
      setMessages((prevMessages) => [
        ...prevMessages,
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
      <div className="flex items-center justify-center h-[calc(100vh-340px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading conversation...
          </p>
        </div>
      </div>
    );
  }

  // Check if this is a new conversation with only the system message
  const isNewConversation =
    messages.length === 1 &&
    messages[0].role === "system" &&
    !streamingMessage &&
    !isLoading;

  return (
    <div className="flex flex-col h-full">
      {isNewConversation && (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-280px)] md:min-h-[calc(100vh-340px)] gap-8">
          <h1 className="text-3xl font-bold text-center">
            What do you have to learn today?
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

      {(!isNewConversation || streamingMessage || isLoading) && (
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
