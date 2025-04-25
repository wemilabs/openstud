// import { AIPrompt } from "@/components/dashboard/ask-clever/ai-prompt";
// import { ChatHistory } from "@/components/dashboard/ask-clever/chat-history";

// export default function AskCleverPage() {
//   return (
//     <section>
//       <div className="flex items-center justify-end -mt-2 md:pr-9">
//         <ChatHistory />
//       </div>

//       <div className="flex flex-col items-center justify-center min-h-[66vh] px-4 py-8 max-w-3xl mx-auto">
//         <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
//           What can I help you with today?
//         </h1>

//         <ul className="text-muted-foreground mb-8 max-w-md list-disc text-xs font-mono">
//           <li>
//             Ask anything to <code>Clever</code> about your studies, research, or
//             academic questions.
//           </li>
//           <li>Choose the tone that fits better according to your need.</li>
//         </ul>

//         <AIPrompt />

//         <div className="absolute bottom-4">
//           <p className="text-muted-foreground text-center max-w-md text-xs">
//             ⚠️ File attachments, DeepSearch, Think mode, and other features
//             coming soon.
//           </p>
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";

import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(({ id, role, parts }) => (
        <div
          key={id}
          className={cn(
            "whitespace-pre-wrap",
            role === "user" ? "text-right" : "text-left"
          )}
        >
          {parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
        {/* <Textarea
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 shadow-xl"
          placeholder="Say something..."
          value={input}
          onChange={handleInputChange}
        /> */}
      </form>
    </div>
  );
}
