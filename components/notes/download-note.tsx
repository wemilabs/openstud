"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Icons } from "@/components/icons";

export function DownloadNote({ noteId }: { noteId: string }) {
  const router = useRouter();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 bg-muted text-primary dark:text-primary hover:bg-muted/90 "
            onClick={() => router.push(`/api/note/${noteId}`)}
          >
            <Icons.download className="size-4" />
            <span className="sr-only">Download note</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Download note</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
