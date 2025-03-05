'use client';

/**
 * Conversation List Component
 * 
 * Displays a list of previous AI conversations
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ConversationListProps {
  conversations: any[];
}

export function ConversationList({ conversations }: ConversationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentId = searchParams.get('id');

  // Start a new conversation
  const startNewConversation = () => {
    router.push('/dashboard/ai-tutor');
  };

  // Open a conversation
  const openConversation = (id: string) => {
    router.push(`/dashboard/ai-tutor?id=${id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Button 
          onClick={startNewConversation}
          className="w-full justify-start"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left h-auto py-3',
                  conversation.id === currentId && 'bg-accent'
                )}
                onClick={() => openConversation(conversation.id)}
              >
                <div className="flex items-start gap-2 w-full overflow-hidden">
                  <MessageSquare className="h-4 w-4 mt-1 shrink-0" />
                  <div className="truncate">
                    <div className="font-medium truncate">
                      {conversation.title || 'New Conversation'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(conversation.updatedAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              </Button>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No conversations yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
