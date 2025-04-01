import Link from "next/link";
import { AIPrompt } from "@/components/dashboard/ai-prompt";

export default function AskCleverPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 max-w-3xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
        What can I help you master today?
      </h1>

      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Ask anything to <code>Clever</code> about your studies, research, or
        academic questions.
      </p>

      <AIPrompt />

      <div className="mt-10">
        <Link
          href="/dashboard/ask-clever/chat/history"
          className="text-primary hover:underline"
        >
          View your conversation history
        </Link>
      </div>
    </div>
  );
}
