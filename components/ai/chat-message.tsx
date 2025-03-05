"use client";

import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ChatMessage as ChatMessageType } from "@/lib/ai";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { data: session } = useSession();
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-4 max-w-full",
        isUser ? "flex-row-reverse" : ""
      )}
    >
      {/* Avatar */}
      {isUser ? (
        <Avatar>
          <AvatarImage src={session?.user?.image || ""} />
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message content */}
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
        </div>
      </div>
    </div>
  );
}
