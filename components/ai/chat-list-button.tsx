"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { deleteConversationById } from "@/actions/ai-chat";
import { toast } from "sonner";

interface ChatListButtonProps {
  conversations: any[];
}

export function ChatListButton({ conversations }: ChatListButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Start a new chat
  const startNewChat = () => {
    router.push(pathname);
    setIsOpen(false);
  };

  // Open a chat
  const openChat = (id: string) => {
    router.push(`${pathname}?id=${id}`);
    setIsOpen(false);
  };

  // Handle opening the delete dialog
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the conversation
    setConversationToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirming deletion
  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteConversationById(conversationToDelete);

      if (result.success) {
        toast.success("Conversation deleted");
        router.refresh(); // Refresh to update the list
      } else {
        toast.error(result.error || "Failed to delete conversation");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the conversation");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 h-9 cursor-pointer"
            title="Open chat list"
          >
            <MessageSquare className="size-4" />
            <span className="text-muted-foreground">Chats</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start" sideOffset={5}>
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium">Chats</h3>
            <Button
              onClick={startNewChat}
              variant="outline"
              size="sm"
              className="h-8"
              title="New chat"
            >
              <Plus className="mr-1 size-4" />
              New Chat
            </Button>
          </div>

          <ScrollArea className="h-[400px] max-h-[60vh]">
            <div className="p-1">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between rounded-md hover:bg-accent group"
                  >
                    <div
                      className="flex-grow min-w-0 cursor-pointer py-2 px-2 overflow-hidden"
                      onClick={() => openChat(conversation.id)}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <MessageSquare className="h-4 w-4 mt-1 shrink-0" />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="text-sm font-medium truncate max-w-[160px]">
                            {conversation.title || "New Conversation"}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {format(
                              new Date(conversation.updatedAt),
                              "MMM d, yyyy"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 mr-1 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) =>
                        handleDeleteClick(
                          conversation.id,
                          e as React.MouseEvent
                        )
                      }
                      title="Delete conversation"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  No conversations yet
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-muted dark:text-primary hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
