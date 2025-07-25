import { AIPrompt } from "@/components/dashboard/ask-qlever/ai-prompt";
import { ChatHistory } from "@/components/dashboard/ask-qlever/chat-history";

export default function AskQleverPage() {
  return (
    <section>
      <div className="flex items-center justify-end -mt-2 md:pr-9">
        <ChatHistory />
      </div>

      <div className="flex flex-col items-center justify-center min-h-[66vh] px-4 py-8 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
          What can I help you with today?
        </h1>

        <ul className="text-muted-foreground mb-8 max-w-md list-disc text-xs font-mono">
          <li>
            Ask anything to <code>Qlever</code> about your studies, research, or
            academic questions.
          </li>
          <li>Choose the tone that fits better according to your need.</li>
        </ul>

        <AIPrompt />

        <div className="absolute bottom-10">
          <p className="text-muted-foreground text-center max-w-md text-xs">
            ⚠️ More features coming soon.
          </p>
        </div>
      </div>
    </section>
  );
}
