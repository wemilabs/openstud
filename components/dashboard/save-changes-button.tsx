"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, X, Loader2 } from "lucide-react";
import { useTaskChanges } from "@/contexts/task-changes-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SaveChangesButton() {
  const {
    hasPendingChanges,
    pendingChanges,
    saveAllChanges,
    discardAllChanges,
  } = useTaskChanges();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAllChanges();
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasPendingChanges) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 flex gap-2 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              onClick={discardAllChanges}
              disabled={isSaving}
            >
              <X className="size-4 mr-1" />
              Discard
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Discard all unsaved changes</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <Save className="size-4 mr-1" />
              )}
              Save {pendingChanges.length}{" "}
              {pendingChanges.length === 1 ? "Change" : "Changes"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save all pending changes</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
