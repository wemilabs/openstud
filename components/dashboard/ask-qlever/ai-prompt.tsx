"use client";

import { useRef, useEffect, useState, useTransition } from "react";

import { createNewConversation, PersonaType } from "@/lib/actions/ai-convo";
import { cn } from "@/lib/utils";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResearchModeAndSuggestionItem {
  label?: string;
  icon: React.ReactNode;
  tooltip?: string;
  disabled?: boolean;
}

interface Persona {
  value: PersonaType;
  label: string;
  description?: string;
}

const researchModeAndSuggestionItems: ResearchModeAndSuggestionItem[] = [
  {
    label: "",
    icon: <Icons.paperclip className="size-4" />,
    tooltip: "Attach files",
    disabled: true,
  },
  {
    label: "Search",
    icon: <Icons.globe className="size-4" />,
    tooltip: "Search the web",
    disabled: false,
  },
  // {
  //   label: "DeepSearch",
  //   icon: <Icons.search className="size-4" />,
  //   tooltip: "Advanced search and reasoning",
  //   disabled: true,
  // },
  {
    label: "Think",
    icon: <Icons.lightbulb className="size-4" />,
    tooltip: "Let Qlever take its time",
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

const PERSONAS: Persona[] = [
  {
    value: "tutor",
    label: "Tutor",
    description: "Get help understanding difficult concepts",
  },
  {
    value: "study-buddy",
    label: "Study Buddy",
    description: "Collaborate on study sessions and material",
  },
  {
    value: "writing-assistant",
    label: "Writing Assistant",
    description: "Help with essays and academic writing",
  },
  {
    value: "project-helper",
    label: "Project Helper",
    description: "Break down and plan academic projects",
  },
];

export function AIPrompt() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>("tutor");
  const [query, setQuery] = useState("");
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);

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

    textarea.addEventListener("input", adjustHeight);
    return () => textarea.removeEventListener("input", adjustHeight);
  }, []);

  useEffect(() => {
    setIsButtonEnabled(query.trim().length > 0);
  }, [query]);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle search button toggle
  const handleSearchToggle = () => {
    setIsWebSearchEnabled(!isWebSearchEnabled);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim() || isPending) return;

    startTransition(async () => {
      await createNewConversation({
        query,
        persona: selectedPersona,
        isWebSearchEnabled,
      });
    });
  };

  return (
    <div className="w-full">
      <form className="w-full" onSubmit={handleSubmit}>
        <div className="flex flex-col w-full">
          <div className="relative group">
            <Textarea
              ref={textareaRef}
              name="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you wanna know?"
              className="resize-none overflow-auto border-t border-x rounded-t-xl border-b-0 rounded-b-none p-4 pr-12 py-4 min-h-[120px] max-h-[300px] focus-visible:ring-0 focus-visible:ring-offset-0 text-xs"
              autoFocus
              rows={3}
            />

            <div className="absolute left-0 right-0 -bottom-13 px-3 py-2 flex justify-between items-center border-t-0 border-b border-x rounded-b-xl">
              <div className="flex items-center gap-2 text-muted-foreground">
                {researchModeAndSuggestionItems
                  .slice(0, 3)
                  .map(({ label, icon, tooltip, disabled }, index) => (
                    <TooltipProvider key={label}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size={isLargeScreen ? "sm" : "icon"}
                            className={cn(
                              "text-xs font-normal border",
                              isLargeScreen
                                ? "gap-1.5 rounded-xl"
                                : "rounded-full",

                              index === 1 && isWebSearchEnabled
                                ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300"
                                : ""
                            )}
                            onClick={() => {
                              if (index === 1) {
                                handleSearchToggle();
                              } else {
                                alert(`${label}: Not implemented yet`);
                              }
                            }}
                            disabled={disabled && index !== 1}
                          >
                            {icon}
                            {isLargeScreen ? label : ""}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {index === 1
                              ? isWebSearchEnabled
                                ? "Disable web search"
                                : "Search the web for up-to-date information"
                              : tooltip}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <Select
                    defaultValue="tutor"
                    onOpenChange={setIsSelectOpen}
                    onValueChange={(value: string) =>
                      setSelectedPersona(value as PersonaType)
                    }
                  >
                    <SelectTrigger className="border-none mr-1 cursor-pointer hover:bg-muted font-medium">
                      <SelectValue placeholder="Select persona" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectGroup>
                        <SelectLabel className="font-semibold">
                          Personas
                        </SelectLabel>
                        {PERSONAS.map(({ label, value, description }) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex flex-col">
                              <span>{label}</span>
                              <span
                                className={cn(
                                  "text-xs text-muted-foreground",
                                  isSelectOpen ? "" : "hidden"
                                )}
                              >
                                {description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  size="icon"
                  disabled={!isButtonEnabled || isPending}
                >
                  {isPending ? (
                    <Icons.spinner className="size-4 animate-spin" />
                  ) : (
                    <Icons.arrowUp className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center mt-13 px-1 py-6">
            <div className="grid grid-cols-2 md:flex items-center gap-4 text-muted-foreground">
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
                          className="gap-1.5 text-xs font-normal border rounded-xl"
                          onClick={() => alert(`${label}: Not implemented yet`)}
                          disabled={disabled}
                        >
                          {icon}
                          {label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{tooltip}</p>
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
