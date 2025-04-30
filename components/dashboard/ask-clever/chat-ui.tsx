"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addMessageToConversation } from "@/actions/ai-convo";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatUI({
  initialMessages,
  conversationId,
}: {
  initialMessages: Message[];
  conversationId: string;
}) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
  } = useChat({
    api: "/api/chat",
    initialMessages: initialMessages,
    onFinish: async (message) => {
      await addMessageToConversation(
        conversationId,
        "assistant",
        message.content
      );
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "user") {
      reload();
    }
  }, [messages, reload]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !isLoading) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener("keydown", handleKeyDown);
      return () => textarea.removeEventListener("keydown", handleKeyDown);
    }
  }, [isLoading]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    await addMessageToConversation(conversationId, "user", input);

    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto pb-20">
        {messages.map(({ id, role, content }) => (
          <div
            key={id}
            className={cn(
              "flex px-4 py-6",
              role === "user"
                ? "bg-muted/50 rounded-2xl justify-end"
                : "bg-background justify-start"
            )}
          >
            <div className="flex-initial prose prose-slate dark:prose-invert max-w-none">
              {content ? (
                <div className="break-words">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 leading-relaxed">{children}</p>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mb-3 mt-6">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold mb-2 mt-5">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-bold mb-2 mt-4">
                          {children}
                        </h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-6 mb-4 space-y-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-6 mb-4 space-y-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="mb-1">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary/40 pl-4 italic my-4">
                          {children}
                        </blockquote>
                      ),
                      pre: ({ node, ...props }) => (
                        <div className="overflow-auto my-4 bg-muted/70 dark:bg-slate-950 p-3 rounded-lg border border-border shadow-sm">
                          <pre className="text-sm" {...props} />
                        </div>
                      ),
                      code: ({ node, className, ...props }: any) => {
                        const isInline = props.inline || false;
                        return isInline ? (
                          <code
                            className="bg-muted dark:bg-slate-900 px-1.5 py-0.5 rounded text-sm font-mono"
                            {...props}
                          />
                        ) : (
                          <code
                            className={`${
                              className || ""
                            } block font-mono text-sm`}
                            {...props}
                          />
                        );
                      },
                      a: ({ children, href }) => (
                        <a
                          className="text-primary underline hover:text-primary/80 transition-colors"
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4 rounded-md border border-border">
                          <table className="min-w-full divide-y divide-border">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-muted/50">{children}</thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="divide-y divide-border">
                          {children}
                        </tbody>
                      ),
                      tr: ({ children }) => <tr>{children}</tr>,
                      th: ({ children }) => (
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-3 text-sm">{children}</td>
                      ),
                      hr: () => <hr className="my-6 border-t border-border" />,
                      img: (props) => (
                        <img
                          className="rounded-md max-w-full my-4 border border-border"
                          {...props}
                          alt={props.alt || ""}
                        />
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-background border-t p-4">
        <form
          ref={formRef}
          onSubmit={handleFormSubmit}
          className="flex gap-2 max-w-4xl mx-auto"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Ask something..."
            className="min-h-[3rem] max-h-[15rem] resize-none"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className=""
          >
            {isLoading ? (
              <Icons.spinner className="size-4 animate-spin" />
            ) : (
              <Icons.arrowUp className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
