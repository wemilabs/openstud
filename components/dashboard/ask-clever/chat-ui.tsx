"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { cn } from "@/lib/utils";
import { addMessageToConversation } from "@/actions/ai-convo";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";
import { CopyButton } from "./copy-button";
import { PersonaType } from "@/actions/ai-convo";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatUI({
  initialMessages,
  conversationId,
  persona,
}: {
  initialMessages: Message[];
  conversationId: string;
  persona: PersonaType;
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
    id: conversationId,
    body: { persona },
    onFinish: async (message) => {
      await addMessageToConversation(
        conversationId,
        "assistant",
        message.content,
        persona
      );
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialResponseTriggered = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (
      !initialResponseTriggered.current &&
      messages.length === 1 &&
      messages[0].role === "user" &&
      initialMessages.length === 1 &&
      initialMessages[0].role === "user" &&
      initialMessages[0].content === messages[0].content
    ) {
      initialResponseTriggered.current = true;
      reload();
    }
  }, [messages, reload, initialMessages]);

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

    await addMessageToConversation(conversationId, "user", input, persona);

    handleSubmit(e);
  };

  return (
    <div className="flex flex-col">
      <div className="pt-6 pb-20">
        {messages.map(({ id, role, content }) => (
          <div
            key={id}
            className={cn(
              "px-4",
              role === "user"
                ? "py-1.5 bg-muted rounded-2xl w-fit ml-auto"
                : "py-8 bg-background"
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
                      code: ({ node, className = "", ...props }: any) => {
                        const isInline = props.inline || false;
                        const match = /language-(\w+)/.exec(className || "");

                        if (isInline) {
                          return (
                            <code
                              className="bg-muted dark:bg-slate-900 px-1.5 py-0.5 rounded text-sm font-mono"
                              {...props}
                            />
                          );
                        }

                        if (match) {
                          const language = match[1];
                          return (
                            <div className="relative my-4">
                              <span
                                className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-white/10 dark:bg-primary/10 text-gray-300 dark:text-primary text-xs font-extralight tracking-wide select-none"
                                style={{
                                  backdropFilter: "blur(2px)",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {language}
                              </span>

                              <CopyButton code={String(props.children)} />

                              <SyntaxHighlighter
                                style={oneDark}
                                language={language}
                                PreTag="div"
                                showLineNumbers
                                customStyle={{
                                  borderRadius: "0.375rem",
                                  fontSize: "0.875rem",
                                  padding: "3rem 1rem 1rem .75rem",
                                  margin: "1rem 0",
                                  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                                }}
                                lineNumberStyle={{
                                  fontStyle: "normal",
                                  paddingRight: "1.5rem",
                                }}
                                {...props}
                              >
                                {String(props.children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }

                        return (
                          <code
                            className={`bg-muted dark:bg-accent px-1.5 py-0.5 rounded font-mono text-sm ${className}`}
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

      <div className="fixed bottom-0 left-0 md:left-[17rem] right-0 bg-background p-4">
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
            className="relative top-2.5 md:top-3.5"
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
