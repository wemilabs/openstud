"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function NewChatButton() {
  const router = useRouter();

  const handleNewChat = () => {
    router.push("/dashboard/ai-tutor");
  };

  return (
    <Button
      onClick={handleNewChat}
      className="size-8 rounded-xl bg-blue-500 text-white hover:bg-blue-500/90 cursor-pointer"
      title="New chat"
    >
      <Plus className="size-4" />
    </Button>
  );
}
