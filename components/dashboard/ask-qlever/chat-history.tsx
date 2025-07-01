"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import {
  deleteConversation,
  getAllConversations,
} from "@/lib/actions/ai-convo";
import { cn } from "@/lib/utils";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
  CommandSeparator,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHistoryProps {
  currentId?: string;
}

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: Date;
}

export function ChatHistory({ currentId }: ChatHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const fetchedConversations = await getAllConversations();
        const mappedConversations = fetchedConversations.map((convo) => ({
          id: convo.id,
          title: convo.title,
          updatedAt: convo.updatedAt,
        }));
        setConversations(mappedConversations);
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
      setIsLoading(false);
    };

    fetchConversations();
  }, []);

  const handleDelete = (conversationId: string) => {
    startTransition(async () => {
      await deleteConversation(conversationId);
      setConversations((prev) =>
        prev.filter((convo) => convo.id !== conversationId)
      );
      if (currentId === conversationId) {
        router.push("/dashboard/ask-qlever");
      }
      setConfirmDeleteId(null);
    });
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/dashboard/ask-qlever">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-md"
          >
            <Icons.add className="size-5" />
          </Button>
        </Link>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-md"
                onClick={() => setIsOpen((open) => !open)}
              >
                <Icons.textSearch className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                Chat history{" "}
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput placeholder="Search history..." />
        <CommandList>
          <CommandEmpty>No conversations found.</CommandEmpty>

          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading conversations...
            </div>
          ) : (
            <>
              <CommandGroup heading="New Conversation">
                <CommandItem
                  onSelect={() => {
                    router.push("/dashboard/ask-qlever");
                    setIsOpen(false);
                  }}
                >
                  <Icons.add className="mr-2 size-4" />
                  <span>New Chat</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              {conversations.length > 0 && (
                <CommandGroup heading="Recent Conversations">
                  {conversations.map((convo) => (
                    <CommandItem
                      key={convo.id}
                      className="justify-between group"
                      value={convo.title || "Untitled Conversation"}
                      onSelect={() => {
                        router.push(`/dashboard/ask-qlever/chat/${convo.id}`);
                        setIsOpen(false);
                      }}
                    >
                      <Link
                        href={`/dashboard/ask-qlever/chat/${convo.id}`}
                        className={cn(
                          "truncate flex-1",
                          currentId === convo.id && "font-bold"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {convo.title || "Untitled Conversation"}
                      </Link>
                      <div className="flex items-center space-x-1">
                        {confirmDeleteId === convo.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(convo.id);
                              }}
                              disabled={isPending}
                              aria-label="Confirm delete"
                            >
                              {isPending ? (
                                <Icons.spinner className="size-3.5 animate-spin" />
                              ) : (
                                <Icons.check className="size-3.5 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              disabled={isPending}
                              aria-label="Cancel delete"
                            >
                              <Icons.close className="size-3.5 text-red-500" />
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              {formatDistanceToNow(new Date(convo.updatedAt), {
                                addSuffix: true,
                              })}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(convo.id);
                              }}
                              disabled={isPending}
                              aria-label="Delete conversation"
                            >
                              <Icons.trash2 className="size-3.5 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
