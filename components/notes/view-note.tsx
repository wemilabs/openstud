"use client";

import { useState } from "react";
import { Note } from "@/generated/prisma/client";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";

interface ViewNoteProps {
  note: Note;
  trigger?: React.ReactNode;
}

export function ViewNote({ note, trigger }: ViewNoteProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Card
            className="overflow-hidden transition-all hover:shadow-md "
            onClick={() => setOpen(true)}
          >
            <CardHeader>
              <CardTitle className="line-clamp-1 text-base">
                {note.title}
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                Last updated {formatDistanceToNow(note.updatedAt)} ago
              </div>
            </CardHeader>
            <CardContent>
              <div className="line-clamp-4 text-sm">
                {note.content || "No content"}
              </div>
            </CardContent>
          </Card>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{note.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <Calendar className="size-3" />
            <span>Last updated {formatDistanceToNow(note.updatedAt)} ago</span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(80vh-120px)]">
          <div className="space-y-4 p-1">
            <div className="whitespace-pre-wrap text-sm">
              {note.content || "This note has no content."}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
