"use client";

import { useRef, useEffect, useState } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResearchModeAndSuggestionItem {
  label?: string;
  icon: React.ReactNode;
  tooltip?: string;
  disabled?: boolean;
}

const researchModeAndSuggestionItems: ResearchModeAndSuggestionItem[] = [
  {
    label: "",
    icon: <Icons.paperclip className="size-4" />,
    tooltip: "Attach files",
    disabled: true,
  },
  {
    label: "DeepSearch",
    icon: <Icons.search className="size-4" />,
    tooltip: "Advanced search and reasoning",
    disabled: true,
  },
  {
    label: "Think",
    icon: <Icons.lightbulb className="size-4" />,
    tooltip: "Let Clever take its time",
    disabled: true,
  },
  {
    label: "Research",
    icon: <Icons.note className="size-4" />,
    tooltip: "Look up information thoroughly",
    disabled: true,
  },
  {
    label: "Create images",
    icon: <Icons.media className="size-4" />,
    tooltip: "Draw images",
    disabled: true,
  },
  {
    label: "Analyze",
    icon: <Icons.chartBar className="size-4" />,
    tooltip: "Interpret data and get insights",
    disabled: true,
  },
  {
    label: "Code",
    icon: <Icons.code className="size-4" />,
    tooltip: "Write, debug, and run code",
    disabled: true,
  },
];

export function AIPrompt() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState("");
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  // Auto resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 300);
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
              placeholder="What do you wanna know?"
              className="resize-none overflow-auto border-t border-x rounded-t-xl border-b-0 rounded-b-none p-4 pr-12 py-4 min-h-[120px] max-h-[300px] focus-visible:ring-0"
              autoFocus
              rows={3}
            />

            <div className="absolute left-0 right-0 -bottom-13 px-3 py-2 flex justify-between items-center border-b border-x rounded-b-xl">
              <div className="flex items-center gap-2 text-muted-foreground">
                {researchModeAndSuggestionItems
                  .slice(0, 3)
                  .map(({ label, icon, tooltip, disabled }) => (
                    <TooltipProvider key={label}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-sm font-normal border rounded-xl"
                            onClick={() =>
                              alert(`${label}: Not implemented yet`)
                            }
                            disabled={disabled}
                          >
                            {icon}
                            {label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">{tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <Select>
                    <SelectTrigger
                      id="personas-according-to-models"
                      className="border-none mr-1 cursor-pointer hover:bg-muted font-medium"
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectGroup>
                        <SelectLabel className="font-semibold">
                          Personas
                        </SelectLabel>
                        <SelectItem value="gemini-2.5-pro">
                          Tutor (Gemini 2.5 Pro)
                        </SelectItem>
                        <SelectItem value="grok-3">
                          Homework Helper (Grok 3)
                        </SelectItem>
                        <SelectItem value="sonar-perplexity-ai">
                          Latest News (Sonar - Perplexity AI)
                        </SelectItem>
                        <SelectItem value="grok-2">
                          Companion (Grok 2)
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
          </div>

          <div className="flex items-center justify-center mt-13 px-1 py-6">
            <div className="flex items-center gap-4 text-muted-foreground">
              {researchModeAndSuggestionItems
                .slice(3)
                .map(({ label, icon, tooltip, disabled }) => (
                  <TooltipProvider key={label}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-sm font-normal border rounded-xl"
                          onClick={() => alert(`${label}: Not implemented yet`)}
                          disabled={disabled}
                        >
                          {icon}
                          {label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">{tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
