"use client";

import { Note } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { EditNote } from "./edit-note";
import { DeleteNote } from "./delete-note";
import { ViewNote } from "./view-note";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface NoteListProps {
  notes: Note[] | undefined;
  courseId: string;
}

export function NoteList({ notes = [], courseId }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No notes yet</h3>
          <p className="mb-4 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground">
            You haven't created any notes for this course yet. Start by adding your first note.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-350px)]">
      <div className="grid gap-4 md:grid-cols-2">
        {notes.map((note) => (
          <div key={note.id} className="relative group">
            <div className="absolute right-2 top-2 z-10 flex space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
              <EditNote note={note} />
              <DeleteNote noteId={note.id} noteTitle={note.title} />
            </div>
            <ViewNote note={{
              ...note,
              content: note.content === null ? null : (note.content || null)
            }} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
