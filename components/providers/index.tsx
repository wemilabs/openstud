"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TaskChangesProvider } from "@/contexts/task-changes-context";
// import { ViewTransition } from "react";

/**
 * Combined providers for the application
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TaskChangesProvider>
          {/* <ViewTransition> */}
          {children}
          {/* </ViewTransition> */}
        </TaskChangesProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
