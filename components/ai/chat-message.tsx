"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Bot, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ChatMessage as ChatMessageType } from "@/lib/ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CodeBlock } from "./code-block";
import type { Components } from "react-markdown";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

/**
 * Chat message component that renders user and assistant messages.
 * Handles markdown formatting and code syntax highlighting.
 */
export function ChatMessage({
  message,
  isStreaming = false,
}: ChatMessageProps) {
  const { data: session } = useSession();
  const isUser = message.role === "user";
  const [isCopied, setIsCopied] = useState(false);

  // Handle copying the entire message content
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);

      // Reset copy status after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  // Define ReactMarkdown custom components
  const markdownComponents: Components = {
    // Use divs instead of p tags to avoid nesting issues
    p: ({ children }) => <div className="my-3">{children}</div>,

    h1: ({ children }) => (
      <h1 className="text-xl font-bold mt-6 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-bold mt-5 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-md font-bold mt-4 mb-2">{children}</h3>
    ),

    ul: ({ children }) => <ul className="list-disc pl-6 my-3">{children}</ul>,
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 my-3">{children}</ol>
    ),
    li: ({ children }) => <li className="my-1">{children}</li>,

    a: ({ href, children }) => (
      <a
        href={href}
        className="text-primary underline hover:text-primary/80"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),

    code: ({ node, inline, className, children, ...props }: any) => {
      // Extract language from className (if provided)
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      // For inline code
      if (inline) {
        return (
          <code className="px-1.5 py-0.5 rounded-full bg-muted-foreground/10 text-sm font-mono">
            {children}
          </code>
        );
      }

      // Convert children to string and ensure it's properly formatted
      const content = String(children).replace(/\n$/, "");

      // If content is empty or just whitespace, render a simple pre
      if (!content.trim()) {
        return <pre className="my-4 rounded-md bg-[#1e293b] p-4"></pre>;
      }

      // Check if this is a single word or short phrase without line breaks
      // that would be better rendered as inline code
      if (content.trim().length < 30 && !content.includes("\n")) {
        return (
          <code className="px-2 py-1 rounded-md bg-muted-foreground/10 text-sm font-mono">
            {content}
          </code>
        );
      }

      // For code blocks, use our CodeBlockV2 component
      return <CodeBlock language={language} value={content} />;
    },

    blockquote: ({ children }) => (
      <div className="border-l-4 border-primary/30 pl-4 italic my-3">
        {children}
      </div>
    ),

    hr: () => <hr className="my-4 border-border" />,

    img: ({ src, alt }) => (
      <img src={src} alt={alt} className="rounded-md max-w-full my-4" />
    ),

    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="border-collapse table-auto w-full">{children}</table>
      </div>
    ),

    th: ({ children }) => (
      <th className="border border-border px-4 py-2 text-left font-bold">
        {children}
      </th>
    ),

    td: ({ children }) => (
      <td className="border border-border px-4 py-2">{children}</td>
    ),
  };

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
          "rounded-lg px-4 py-3 max-w-[85%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/70 border border-border/50 shadow-sm relative group"
        )}
      >
        {isUser ? (
          <div className="prose prose-sm dark:prose-invert break-words">
            {message.content.split("\n").map((line, i) => (
              <div key={i} className={line.trim() === "" ? "h-4" : ""}>
                {line}
              </div>
            ))}
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>

            {/* Copy button for AI responses - positioned at the bottom */}
            <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                aria-label={isCopied ? "Copied" : "Copy response"}
                title={isCopied ? "Copied" : "Copy response"}
              >
                {isCopied ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy response</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

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
  );
}
