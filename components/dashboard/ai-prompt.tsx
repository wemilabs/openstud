"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/icons";
import { useRef, useEffect, useState } from "react";

export function AIPrompt() {
  const suggestionTopics = [
    { id: 1, title: "Research project ideas" },
    { id: 2, title: "Study techniques" },
    { id: 3, title: "Assignment help" },
    { id: 4, title: "Exam preparation" },
    { id: 5, title: "Time management tips" },
  ];

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState("");
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  // Auto resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 300); // Max height of 300px
      textarea.style.height = `${newHeight}px`;
    };

    // Call once on mount
    adjustHeight();

    // Setup event listeners
    textarea.addEventListener("input", adjustHeight);
    return () => textarea.removeEventListener("input", adjustHeight);
  }, []);

  // Enable button when query has content
  useEffect(() => {
    setIsButtonEnabled(query.trim().length > 0);
  }, [query]);

  return (
    <div className="w-full">
      <form
        className="w-full"
        onSubmit={(e) => {
          e.preventDefault();
          if (!query.trim()) return;

          // Redirect to the chat page with the question
          window.location.href = `/dashboard/ask-clever/chat/new?q=${encodeURIComponent(
            query
          )}`;
        }}
      >
        <div className="flex flex-col w-full">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to know?"
              className="resize-none overflow-auto border-t border-x rounded-t-lg border-b-0 p-4 pr-12 py-4 min-h-[120px] max-h-[300px] focus-visible:ring-2"
              autoFocus
              rows={3}
            />

            <div className="absolute left-0 right-0 -bottom-13 px-3 py-2 flex justify-between items-center border-b border-x rounded-b-lg">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs font-normal border rounded-lg"
                >
                  <Icons.paperclip className="h-3.5 w-3.5" />
                  Attach
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs font-normal border rounded-lg"
                >
                  <Icons.search className="h-3.5 w-3.5" />
                  DeepSearch
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs font-normal border rounded-lg"
                >
                  <Icons.lightbulb className="h-3.5 w-3.5" />
                  Think
                </Button>
              </div>

              <Button
                type="submit"
                size="icon"
                className="rounded-full"
                aria-label="Submit question"
                disabled={!isButtonEnabled}
              >
                <Icons.arrowUp className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end mt-12 px-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Research"
                className="rounded-full p-2 h-8 w-8"
              >
                <Icons.note className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Create images"
                className="rounded-full p-2 h-8 w-8"
              >
                <Icons.media className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Analyze"
                className="rounded-full p-2 h-8 w-8"
              >
                <Icons.chartBar className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Code"
                className="rounded-full p-2 h-8 w-8"
              >
                <Icons.code className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
