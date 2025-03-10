"use client";

import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ChatMessage as ChatMessageType } from "@/lib/ai";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({
  message,
  isStreaming = false,
}: ChatMessageProps) {
  const { data: session } = useSession();
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-4 max-w-full",
        isUser ? "flex-row-reverse" : ""
      )}
    >
      {isUser ? (
        <Avatar>
          <AvatarImage src={session?.user?.image || ""} />
          <AvatarFallback>
            <User className="size-5" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "rounded-lg px-4 py-3 max-w-[80%]",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        <div className="prose prose-sm dark:prose-invert">
          {message.content.split("\n").map((line, i) => (
            <p key={i} className={line.trim() === "" ? "h-4" : ""}>
              {line}
            </p>
          ))}
          {isStreaming && (
            <div className="flex items-center mt-2">
              <div className="size-2 bg-primary rounded-full animate-pulse"></div>
              <div className="size-2 bg-primary rounded-full animate-pulse delay-150 mx-1"></div>
              <div className="size-2 bg-primary rounded-full animate-pulse delay-300"></div>
              <span className="text-xs text-muted-foreground ml-2">
                Generating...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
